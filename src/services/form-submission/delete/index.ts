import { getPrisma } from "../../../lib/prisma";
import {
  DeleteFormSubmissionParams,
  DeleteFormSubmissionResponse,
} from "../../../types/form-submission/delete";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";

export const deleteFormSubmission = async (
  userId: number,
  params: DeleteFormSubmissionParams
): Promise<DeleteFormSubmissionResponse> => {
  const prisma = getPrisma();

  // 1. Check if the form submission exists and get related info
  const submission = await prisma.formSubmission.findUnique({
    where: { id: params.submissionId },
    select: {
      id: true,
      sessionId: true,
      formId: true,
      form: {
        select: {
          id: true,
          funnelId: true,
        },
      },
    },
  });

  if (!submission || !submission.form.funnelId) {
    throw new Error("Form submission not found");
  }

  // 2. Get funnel to find workspace
  const funnel = await prisma.funnel.findUnique({
    where: { id: submission.form.funnelId },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  if (!funnel) {
    throw new Error("Form submission not found");
  }

  // 3. Check if user has DELETE_FORM permission
  const permissionCheck = await PermissionManager.can({
    userId,
    workspaceId: funnel.workspaceId,
    action: PermissionAction.DELETE_FORM,
  });

  if (!permissionCheck.allowed) {
    throw new Error(
      "You don't have permission to delete form submissions. Only workspace owners, admins, and editors with delete permissions can perform this action."
    );
  }

  // 4. Get session to update interactions
  const session = await prisma.session.findUnique({
    where: { sessionId: submission.sessionId },
    select: {
      id: true,
      sessionId: true,
      interactions: true,
    },
  });

  // 5. Delete the form submission (Prisma cascade handles relations)
  await prisma.formSubmission.delete({
    where: { id: params.submissionId },
  });

  // 6. Update session interactions to remove this form submission
  if (session && session.interactions) {
    const interactions = session.interactions as any;

    if (interactions.form_submissions && Array.isArray(interactions.form_submissions)) {
      // Filter out the deleted submission by submissionId
      interactions.form_submissions = interactions.form_submissions.filter(
        (fs: any) => fs.submissionId !== submission.id
      );

      // Update the session with modified interactions
      await prisma.session.update({
        where: { sessionId: session.sessionId },
        data: { interactions },
      });
    }
  }

  return {
    message: "Form submission deleted successfully",
  };
};
