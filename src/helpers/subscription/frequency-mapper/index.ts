import { $Enums } from "../../../generated/prisma-client";

/**
 * Map webhook frequency to IntervalUnit enum
 */
export function mapFrequencyToIntervalUnit(frequency: string): $Enums.IntervalUnit {
  switch (frequency) {
    case 'weekly':
      return $Enums.IntervalUnit.WEEK;
    case 'monthly':
      return $Enums.IntervalUnit.MONTH;
    case 'annually':
      return $Enums.IntervalUnit.YEAR;
    default:
      return $Enums.IntervalUnit.MONTH;
  }
}