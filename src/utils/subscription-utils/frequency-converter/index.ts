/**
 * Converts payment frequency format to trial period format
 * Used for webhook processing where frequency comes in different format than trial period
 */
export class FrequencyConverter {
  /**
   * Converts frequency + frequencyInterval to trial period format
   * @param frequency - "annually", "monthly", "weekly", or "daily"
   * @param frequencyInterval - Number of intervals (e.g., 1, 2, 3)
   * @returns Trial period string in format like "1y", "2m", "3w", "30d"
   * @throws Error if frequency is not recognized
   *
   * @example
   * convertToTrialPeriod("annually", 1) // Returns "1y"
   * convertToTrialPeriod("monthly", 6) // Returns "6m"
   * convertToTrialPeriod("weekly", 2) // Returns "2w"
   */
  static convertToTrialPeriod(
    frequency: string,
    frequencyInterval: number = 1
  ): string {
    const normalizedFrequency = frequency.toLowerCase().trim();

    switch (normalizedFrequency) {
      case "annually":
      case "yearly":
      case "annual":
      case "year":
        return `${frequencyInterval}y`;

      case "monthly":
      case "month":
        return `${frequencyInterval}m`;

      case "weekly":
      case "week":
        return `${frequencyInterval}w`;

      case "daily":
      case "day":
        return `${frequencyInterval}d`;

      default:
        throw new Error(
          `Unsupported frequency type: ${frequency}. Supported: annually, monthly, weekly, daily`
        );
    }
  }

  /**
   * Converts frequency to IntervalUnit enum for database
   * @param frequency - "annually", "monthly", or "weekly"
   * @returns IntervalUnit enum value
   */
  static convertToIntervalUnit(frequency: string): "YEAR" | "MONTH" | "WEEK" {
    const normalizedFrequency = frequency.toLowerCase().trim();

    switch (normalizedFrequency) {
      case "annually":
      case "yearly":
      case "annual":
      case "year":
        return "YEAR";

      case "monthly":
      case "month":
        return "MONTH";

      case "weekly":
      case "week":
        return "WEEK";

      default:
        throw new Error(
          `Unsupported frequency type: ${frequency}. Supported: annually, monthly, weekly`
        );
    }
  }
}
