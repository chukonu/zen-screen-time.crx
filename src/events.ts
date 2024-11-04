export enum ZenEvents {
  /**
   * A new value of the current date.
   */
  NewDate = 'zennewdate',

  /**
   * A new value of the number of items to show in `zen-animated-grid`.
   */
  NewNumberOfItems = 'zennewnumberofitems',

  RouteBack = 'zenrouteback',
  RouteChange = 'zenroutechange',
}

export type DateInMillis = number;
export type NewDateEvent = CustomEvent<DateInMillis>;
