import { z } from "zod";
import crypto from "crypto";
import {
  ConfigureWebhookRequest,
  ConfigureWebhookResponse,
  configureWebhookRequest,
  configureWebhookResponse,
  WebhookPayload,
} from "../../../types/form/webhook";
import { getPrisma } from "../../../lib/prisma";
import { hasPermissionToConfigureWebhook } from "../../../helpers/form/webhook";

export const configureWebhook = async (
  userId: number,
  data: Partial<ConfigureWebhookRequest>
): Promise<ConfigureWebhookResponse> => {
  let validatedData: ConfigureWebhookRequest = {} as ConfigureWebhookRequest;

  try {
    if (!userId) throw new Error("User ID is required");

    validatedData = configureWebhookRequest.parse(data);

    const prisma = getPrisma();

    // Get form
    const form = await prisma.form.findUnique({
      where: { id: validatedData.formId },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    if (!form.funnelId) {
      throw new Error(
        "Cannot configure webhook for forms not associated with a funnel"
      );
    }

    // Get funnel with workspace information
    const funnel = await prisma.funnel.findUnique({
      where: { id: form.funnelId },
      select: {
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Check permissions
    const isOwner = funnel.workspace.ownerId === userId;

    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: funnel.workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!member) {
        throw new Error(`You don't have access to this workspace`);
      }

      const canConfigureWebhook = hasPermissionToConfigureWebhook(
        member.role,
        member.permissions
      );

      if (!canConfigureWebhook) {
        throw new Error("You don't have permission to configure webhooks");
      }
    }

    // Update form with webhook configuration
    await prisma.form.update({
      where: { id: validatedData.formId },
      data: {
        webhookUrl: validatedData.webhookUrl,
        webhookEnabled: validatedData.webhookEnabled,
        webhookHeaders: validatedData.webhookHeaders || {},
        webhookSecret: validatedData.webhookSecret,
      },
    });

    const response = {
      message: "Webhook configuration updated successfully",
      success: true,
    };

    return configureWebhookResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to configure webhook: ${error.message}`);
    }
    throw new Error("Couldn't configure the webhook. Please try again.");
  }
};

export const triggerFormSubmissionWebhook = async (
  formId: number,
  payload: WebhookPayload
): Promise<void> => {
  try {
    const prisma = getPrisma();

    // Get form webhook configuration
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: {
        webhookUrl: true,
        webhookEnabled: true,
        webhookHeaders: true,
        webhookSecret: true,
      },
    });

    if (!form?.webhookEnabled || !form.webhookUrl) {
      return;
    }

    const result = await sendWebhookRequest(
      form.webhookUrl,
      payload,
      form.webhookHeaders as any,
      form.webhookSecret
    );

    if (result.success) {
      await prisma.form.update({
        where: { id: formId },
        data: {
          webhookSuccessCount: { increment: 1 },
          lastWebhookAt: new Date(),
        },
      });
    } else {
      await prisma.form.update({
        where: { id: formId },
        data: {
          webhookFailureCount: { increment: 1 },
          lastWebhookAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error(`Failed to trigger webhook for form ${formId}:`, error);
  }
};

async function sendWebhookRequest(
  url: string,
  payload: any,
  headers?: Record<string, string>,
  secret?: string | null
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const body = JSON.stringify(payload);

    // Generate signature if secret is provided
    const signature = secret
      ? crypto.createHmac("sha256", secret).update(body).digest("hex")
      : null;

    const requestHeaders: any = {
      "Content-Type": "application/json",
      "User-Agent": "FunnelBuilder-Webhook/1.0",
      ...(headers || {}),
    };

    if (signature) {
      requestHeaders["X-Webhook-Signature"] = `sha256=${signature}`;
      requestHeaders["X-Webhook-Signature-256"] = `sha256=${signature}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: "POST",
      headers: requestHeaders,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      success: response.ok,
      status: response.status,
      error: response.ok
        ? undefined
        : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.name === "AbortError" ? "Request timeout" : error.message,
    };
  }
}