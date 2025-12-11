/**
 * Calculate subscription end date based on frequency and interval
 */
export function calculateEndDate(startDate: Date, frequency: string, interval: number): Date {
  const endDate = new Date(startDate);
  
  switch (frequency) {
    case 'weekly':
      endDate.setDate(endDate.getDate() + (7 * interval));
      break;
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + interval);
      break;
    case 'annually':
      endDate.setFullYear(endDate.getFullYear() + interval);
      break;
    default:
      // Default to 1 month
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
}