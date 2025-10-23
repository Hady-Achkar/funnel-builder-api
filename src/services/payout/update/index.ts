import { getPrisma } from "../../../lib/prisma";
import {
  UpdatePayoutRequest,
  UpdatePayoutResponse,
} from "../../../types/payout/update";
import { Payout } from "../../../generated/prisma-client";
import { formatPayoutResponse } from "./utils/format-payout-response";
import { prepareUpdateData } from "./utils/prepare-update-data";
import {
  buildAdminHistoryEntry,
  appendToAdminHistory,
  extractChanges,
} from "./utils/build-admin-history";
import sgMail from "@sendgrid/mail";
import {
  getPayoutCompletedEmailHtml,
  getPayoutCompletedEmailText,
  PayoutCompletedData,
} from "../../../constants/emails/payout/completed";
import {
  getPayoutFailedEmailHtml,
  getPayoutFailedEmailText,
  PayoutFailedData,
} from "../../../constants/emails/payout/failed";

let sendgridInitialized = false;

function initializeSendGrid() {
  if (!sendgridInitialized) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }
    sgMail.setApiKey(apiKey);
    sendgridInitialized = true;
  }
}

export class UpdatePayoutService {
  static async update(
    payoutId: number,
    request: UpdatePayoutRequest,
    isUserSelfCancellation: boolean = false,
    adminCode?: string
  ): Promise<UpdatePayoutResponse> {
    try {
      const prisma = getPrisma();

      // Get current payout data
      const currentPayout = await prisma.payout.findUnique({
        where: { id: payoutId },
      });

      if (!currentPayout) {
        throw new Error("Payout not found");
      }

      // Prepare update data with timestamps
      const updateData = prepareUpdateData(
        request,
        currentPayout.status,
        currentPayout.processedAt
      );

      // Ensure there's something to update
      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      let updatedPayout: Payout;

      // Handle COMPLETED status - deduct balance and create transaction
      if (request.status === "COMPLETED") {
        // Use transaction to ensure atomicity
        updatedPayout = await prisma.$transaction(async (tx) => {
          // Get current user balance
          const user = await tx.user.findUnique({
            where: { id: currentPayout.userId },
            select: { balance: true },
          });

          if (!user) {
            throw new Error("User not found");
          }

          const balanceBefore = user.balance;
          const balanceAfter = balanceBefore - currentPayout.amount;

          // Update payout status
          const payout = await tx.payout.update({
            where: { id: payoutId },
            data: updateData,
          });

          // Deduct balance from user
          await tx.user.update({
            where: { id: currentPayout.userId },
            data: { balance: balanceAfter },
          });

          // Create balance transaction only if it doesn't exist
          const existingTransaction = await tx.balanceTransaction.findUnique({
            where: { payoutId: payoutId },
          });

          if (!existingTransaction) {
            await tx.balanceTransaction.create({
              data: {
                userId: currentPayout.userId,
                amount: -Math.abs(currentPayout.amount),
                type: "WITHDRAWAL",
                referenceType: "PAYOUT",
                referenceId: payoutId,
                payoutId: payoutId,
                balanceBefore,
                balanceAfter,
              },
            });
          }

          // Build and save admin history if adminCode is provided
          if (adminCode) {
            const statusChanged =
              request.status && request.status !== currentPayout.status;
            const changes = extractChanges(request, !!statusChanged);

            const newEntry = buildAdminHistoryEntry(
              adminCode,
              currentPayout.status,
              request.status || null,
              changes,
              payout // Pass the updated payout record
            );

            const updatedHistory = appendToAdminHistory(
              currentPayout.adminHistory,
              newEntry
            );

            // Update with admin history
            const payoutWithHistory = await tx.payout.update({
              where: { id: payoutId },
              data: { adminHistory: updatedHistory },
            });

            return payoutWithHistory;
          }

          return payout;
        });
      } else {
        // For other status updates or admin field updates
        updatedPayout = await prisma.payout.update({
          where: { id: payoutId },
          data: updateData,
        });

        // Build and save admin history if adminCode is provided
        if (adminCode) {
          const statusChanged =
            request.status && request.status !== currentPayout.status;
          const changes = extractChanges(request, !!statusChanged);

          const newEntry = buildAdminHistoryEntry(
            adminCode,
            currentPayout.status,
            request.status || null,
            changes,
            updatedPayout // Pass the updated payout record
          );

          const updatedHistory = appendToAdminHistory(
            currentPayout.adminHistory,
            newEntry
          );

          // Update with admin history
          updatedPayout = await prisma.payout.update({
            where: { id: payoutId },
            data: { adminHistory: updatedHistory },
          });
        }
      }

      // Send email notification if status changed to COMPLETED or FAILED
      if (request.status === "COMPLETED" || request.status === "FAILED") {
        try {
          initializeSendGrid();

          // Get user details for email
          const user = await prisma.user.findUnique({
            where: { id: updatedPayout.userId },
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          });

          if (user && user.email) {
            const recipientName =
              `${user.firstName} ${user.lastName}`.trim() || "User";

            if (request.status === "COMPLETED") {
              const emailData: PayoutCompletedData = {
                recipientName,
                amount: updatedPayout.amount,
                fees: updatedPayout.fees,
                netAmount: updatedPayout.amount - updatedPayout.fees,
                method: updatedPayout.method,
                currency: updatedPayout.currency,
                accountNumber: updatedPayout.accountNumber || undefined,
                bankName: updatedPayout.bankName || undefined,
                accountHolderName: updatedPayout.accountHolderName || undefined,
                swiftCode: updatedPayout.swiftCode || undefined,
                usdtWalletAddress: updatedPayout.usdtWalletAddress || undefined,
                usdtNetwork: updatedPayout.usdtNetwork || undefined,
              };

              const htmlContent = getPayoutCompletedEmailHtml(emailData);
              const textContent = getPayoutCompletedEmailText(emailData);

              const msg = {
                to: user.email,
                from: {
                  email:
                    process.env.SENDGRID_FROM_EMAIL ||
                    "noreply@digitalsite.com",
                  name: "Digitalsite",
                },
                subject:
                  "Withdrawal Completed Successfully | اكتمل السحب بنجاح",
                html: htmlContent,
                text: textContent,
              };

              await sgMail.send(msg);
            } else if (request.status === "FAILED") {
              const emailData: PayoutFailedData = {
                recipientName,
                amount: updatedPayout.amount,
                fees: updatedPayout.fees,
                netAmount: updatedPayout.amount - updatedPayout.fees,
                method: updatedPayout.method,
                currency: updatedPayout.currency,
                failureReason: updatedPayout.failureReason || undefined,
                transactionId: updatedPayout.transactionId || undefined,
                transactionProof: updatedPayout.transactionProof || undefined,
                documentUrl: updatedPayout.documentUrl || undefined,
                accountNumber: updatedPayout.accountNumber || undefined,
                bankName: updatedPayout.bankName || undefined,
                usdtWalletAddress: updatedPayout.usdtWalletAddress || undefined,
                usdtNetwork: updatedPayout.usdtNetwork || undefined,
              };

              const htmlContent = getPayoutFailedEmailHtml(emailData);
              const textContent = getPayoutFailedEmailText(emailData);

              const msg = {
                to: user.email,
                from: {
                  email:
                    process.env.SENDGRID_FROM_EMAIL ||
                    "noreply@digitalsite.com",
                  name: "Digitalsite",
                },
                subject: "Withdrawal Request Failed | فشل طلب السحب",
                html: htmlContent,
                text: textContent,
              };

              await sgMail.send(msg);
            }
          }
        } catch (emailError: any) {
          // Log email error but don't fail the payout update
          console.error(
            "Failed to send payout notification email:",
            emailError
          );
          if (emailError.response && emailError.response.body) {
            console.error(
              "SendGrid error details:",
              JSON.stringify(emailError.response.body, null, 2)
            );
          }
        }
      }

      // Format response message based on action
      let message = "Payout updated successfully";
      if (isUserSelfCancellation) {
        message = "Your withdrawal request has been cancelled successfully";
      }

      return formatPayoutResponse(updatedPayout, message);
    } catch (error) {
      throw error;
    }
  }
}
