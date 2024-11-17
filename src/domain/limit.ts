/**
 * Limit represents a rule for websites that match a specified pattern.
 */
export default interface Limit {
  id?: number;
  pattern: string;
  /**
   * Limit of screen time in minutes
   */
  limit: number;
  created?: number;
  updated?: number;
}
