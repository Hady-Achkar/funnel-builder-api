import { getPrisma } from "../../../lib/prisma";
import {
  RequestPayoutRequest,
  RequestPayoutResponse,
} from "../../../types/payout/request";
import { calculateFees } from "./utils/calculate-fees";
import { formatPayoutResponse } from "./utils/format-payout-response";

export class RequestPayoutService {
  static async create(
    userId: number,
    data: RequestPayoutRequest
  ): Promise<RequestPayoutResponse> {
    try {
      const prisma = getPrisma();
      const { fees, netAmount } = calculateFees(data.amount, data.method);
      const amount = Math.round(data.amount * 100) / 100;
      const payout = await prisma.payout.create({
        data: {
          userId,
          amount,
          fees,
          netAmount,
          method: data.method,
          status: "PENDING",
          currency: "USD",
          accountHolderName: data.accountHolderName,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          swiftCode: data.swiftCode,
          bankAddress: data.bankAddress,
          usdtWalletAddress: data.usdtWalletAddress,
          usdtNetwork: data.usdtNetwork,
          userNotes: data.userNotes,
        },
      });

      return formatPayoutResponse(payout, amount);
    } catch (error) {
      throw error;
    }
  }
}
