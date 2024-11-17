export enum MessageType {
  /**
   * A request to retrieve activity data for a specified date.
   */
  DataRequest = 'data_request',

  /**
   * A request to check if activity on a website has reached any limit.
   */
  LimitCheck = 'limit_check',

  /**
   * Add a new Limit to DB
   */
  AddLimit = 'add_limit',

  /**
   * Find limits for a given site.
   */
  FindLimitsForSite = 'find_limit_for_site',

  /**
   * A record of activity.
   */
  Pulse = 'pulse',
}

export default MessageType;
