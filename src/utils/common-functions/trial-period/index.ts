/**
 * Utility for calculating trial period dates
 * Supports formats like "1y", "2m", "3w" for year, month, week
 */

export interface TrialPeriodResult {
  trialStartDate: Date;
  trialEndDate: Date;
}

export class TrialPeriodCalculator {
  /**
   * Default trial period is 1 year
   */
  private static readonly DEFAULT_TRIAL_PERIOD = '1y';

  /**
   * Parse period string like "1y", "2m", "3w", "30d"
   * Returns null if invalid format
   */
  static parsePeriod(period: string): { value: number; unit: 'y' | 'm' | 'w' | 'd' } | null {
    const match = period.match(/^(\d+)([ymwd])$/i);
    if (!match) {
      return null;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase() as 'y' | 'm' | 'w' | 'd';

    if (value <= 0) {
      return null;
    }

    return { value, unit };
  }

  /**
   * Calculate trial end date from start date and period string
   */
  static calculateEndDate(startDate: Date, period: string): Date {
    const parsed = this.parsePeriod(period);
    if (!parsed) {
      // If invalid period, use default
      return this.calculateEndDate(startDate, this.DEFAULT_TRIAL_PERIOD);
    }

    const endDate = new Date(startDate);

    switch (parsed.unit) {
      case 'y': // years
        endDate.setFullYear(endDate.getFullYear() + parsed.value);
        break;
      case 'm': // months
        endDate.setMonth(endDate.getMonth() + parsed.value);
        break;
      case 'w': // weeks
        endDate.setDate(endDate.getDate() + (parsed.value * 7));
        break;
      case 'd': // days
        endDate.setDate(endDate.getDate() + parsed.value);
        break;
    }

    return endDate;
  }

  /**
   * Get trial period dates for registration
   * @param trialPeriod Optional period string (e.g., "1y", "2m", "3w"). Defaults to 1 year.
   */
  static getTrialDates(trialPeriod?: string | null): TrialPeriodResult {
    const trialStartDate = new Date(); // Current date/time
    const periodToUse = trialPeriod || this.DEFAULT_TRIAL_PERIOD;
    const trialEndDate = this.calculateEndDate(trialStartDate, periodToUse);

    return {
      trialStartDate,
      trialEndDate,
    };
  }

  /**
   * Validate if a period string is valid
   */
  static isValidPeriod(period: string): boolean {
    return this.parsePeriod(period) !== null;
  }

  /**
   * Get human-readable period description
   */
  static getPeriodDescription(period: string): string {
    const parsed = this.parsePeriod(period);
    if (!parsed) {
      return 'Invalid period';
    }

    const unitNames: Record<string, string> = {
      'y': parsed.value === 1 ? 'year' : 'years',
      'm': parsed.value === 1 ? 'month' : 'months',
      'w': parsed.value === 1 ? 'week' : 'weeks',
      'd': parsed.value === 1 ? 'day' : 'days',
    };

    return `${parsed.value} ${unitNames[parsed.unit]}`;
  }
}

// Export convenience function
export const calculateTrialDates = (trialPeriod?: string | null): TrialPeriodResult => {
  return TrialPeriodCalculator.getTrialDates(trialPeriod);
};