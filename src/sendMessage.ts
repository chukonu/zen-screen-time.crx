import {
  MessageType,
  PayloadOf,
  ResponseDataOf,
  ZMessageResponse,
} from './domain';

const lastError = () => chrome.runtime.lastError;

/**
 * Send a message with error handling.
 */
export default function sendMessage<T extends MessageType>(
  type: T,
  payload: PayloadOf<typeof type>,
): Promise<ResponseDataOf<T>> {
  return new Promise((resolve, reject) => {
    let result: Promise<ZMessageResponse<T>> | null | undefined;

    try {
      result = chrome?.runtime?.sendMessage({ type, payload });
    } catch (error) {
      reject(error);
      return;
    }

    if (!result) {
      reject(new Error('No runtime is available for sending the message.'));
      return;
    }

    result
      .then((response) => {
        if (response?.ok) {
          resolve(response.data);
          return;
        }

        if (!arguments.length) {
          console.error('Found error on fulfilled: ', type, lastError());
          reject(new Error(lastError()?.message));
          return;
        }
      })
      .catch((err) => {
        console.error(`While sending message (type: ${type}): `, err);
        reject(err);
      });
  });
}
