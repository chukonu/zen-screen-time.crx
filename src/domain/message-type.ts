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
   * A record of activity.
   */
  Pulse = 'pulse',
}

export default MessageType;
