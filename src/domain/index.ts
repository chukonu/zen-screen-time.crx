/**
 * Module domain provides domain objects.
 * @module
 */

import { Pulse } from '../Pulse';
import { OriginActivity } from '../side-panel/side-panel';
import Limit from './limit';
import MessageType from './message-type';

export { default as Limit } from './limit';
export { default as Report } from './report';

/**
 * ZMessage describes the required shape of messages sent to the service worker.
 */
export type ZMessage<T extends MessageType> = {
  type: T;
  payload: PayloadOf<T>;
  sender: chrome.runtime.MessageSender;
  sendResponse: ZSendResponse<T>;
};

export type ZSendResponse<T extends MessageType> = (
  response: ZMessageResponse<T>,
) => void;

export type ZMessageResponse<T extends MessageType> = {
  ok: boolean;
  data?: ResponseDataOf<T>;
  reason?: string;
};

/**
 * Payload of `ZMessage`
 *
 * @see {@link ZMessage}
 */
export type PayloadOf<T extends MessageType> = {
  [MessageType.AddLimit]: Limit;
  [MessageType.FindLimitsForSite]: { site: string };
  [MessageType.LimitCheck]: undefined;
  [MessageType.DataRequest]: { date: number };
  [MessageType.Pulse]: Pulse;
}[T];

export type ResponseDataOf<T extends MessageType> = {
  [MessageType.AddLimit]: IDBValidKey;
  [MessageType.FindLimitsForSite]: any[];
  [MessageType.LimitCheck]: OriginActivity[];
  [MessageType.DataRequest]: OriginActivity[];
  [MessageType.Pulse]: any;
}[T];

export { default as MessageType } from './message-type';
