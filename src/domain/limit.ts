/**
 * Limit represents a rule for websites that match a specified pattern.
 */
export type Limit = NewLimit & {
  id?: number;
  created?: number;
  updated?: number;
};

export type NewLimit = {
  pattern: string;
  /**
   * Limit of screen time in minutes
   */
  limit: number;
};
