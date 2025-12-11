/**
 * Calculate Trial Dates Utility
 *
 * Calculates trial start and end dates for migrated users based on
 * their old database trial_end_date or created_at date
 *
 * @see ARCHITECTURE.md - Service utility patterns
 */

import { OldUserData } from '../../../../types/migration/old-user';

/**
 * Trial dates result
 */
export interface TrialDates {
  trialStartDate: Date;
  trialEndDate: Date;
}

/**
 * Calculates trial dates for a migrated user
 *
 * Logic:
 * 1. If old_user.trial_end_date exists: trialEndDate = old_trial_end_date + 1 year
 * 2. Otherwise: trialEndDate = old_user.created_at + 2 years
 * 3. trialStartDate = old_user.created_at (always use original creation date)
 *
 * @param oldUser - Old database user data
 * @returns Trial start and end dates
 *
 * @example
 * const dates = calculateTrialDates(oldUserData);
 * // Returns: { trialStartDate: Date, trialEndDate: Date }
 */
export function calculateTrialDates(oldUser: OldUserData): TrialDates {
  const trialStartDate = new Date(oldUser.created_at);

  let trialEndDate: Date;

  if (oldUser.trial_end_date) {
    // Option 1: Use old trial_end_date + 1 year
    trialEndDate = new Date(oldUser.trial_end_date);
    trialEndDate.setFullYear(trialEndDate.getFullYear() + 1);
  } else {
    // Option 2: Use created_at + 2 years
    trialEndDate = new Date(oldUser.created_at);
    trialEndDate.setFullYear(trialEndDate.getFullYear() + 2);
  }

  return {
    trialStartDate,
    trialEndDate,
  };
}
