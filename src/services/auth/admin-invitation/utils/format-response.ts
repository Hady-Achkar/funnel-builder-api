import { GenerateAdminInvitationResponse } from "../../../../types/auth/admin-invitation";

export interface FormatResponseData {
  token: string;
  invitationUrl: string;
  expiresAt: Date;
}

export function formatResponse(
  data: FormatResponseData
): GenerateAdminInvitationResponse {
  return {
    invitationUrl: data.invitationUrl,
    token: data.token,
    expiresAt: data.expiresAt,
    message: "Invitation sent successfully",
  };
}
