import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { UserPlan } from "../../../../generated/prisma-client";

export interface InvitationTokenData {
  adminCode: string;
  invitedEmail: string;
  plan: UserPlan;
}

export function generateInvitationToken(data: InvitationTokenData): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const payload = {
    adminCode: data.adminCode,
    invitedEmail: data.invitedEmail,
    plan: data.plan,
    type: "admin_invitation" as const,
    tokenId: uuidv4(),
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}
