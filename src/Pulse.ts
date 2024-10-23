/**
 * Pulse is a record of a period of screen time on a website.
 */
export interface Pulse {
  id?: any;

  origin: string;

  // UTC
  startTime: number;

  duration: number;
}

/**
 * Pmap is a map that groups screen time records first by origin and then by time.
 */
export type Pmap = Map<string, Map<number, number>>;

