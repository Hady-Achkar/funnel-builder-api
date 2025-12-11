import { PayoutMethod } from "../../../../generated/prisma-client";

/**
 * Calculate fees based on payment method
 * Pure function - no Prisma, no error throwing
 */
export function calculateFees(
  amount: number,
  method: PayoutMethod
): { fees: number; netAmount: number } {
  let fees = 0;

  switch (method) {
    case "UAE_BANK":
      fees = 1; // Flat $1 fee
      break;

    case "INTERNATIONAL_BANK":
      fees = 38; // Flat $38 fee
      break;

    case "USDT":
      fees = 3 + (amount * 0.03); // $3 base + 3% of amount
      break;
  }

  // Round to 2 decimal places
  fees = Math.round(fees * 100) / 100;
  const netAmount = Math.round((amount - fees) * 100) / 100;

  return { fees, netAmount };
}