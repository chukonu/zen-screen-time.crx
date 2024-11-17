import { filter, Observable, Subject, tap } from 'rxjs';
import { MessageType, ZMessage, ZSendResponse } from '../domain';
import { operate } from 'rxjs/internal/util/lift';
import { createOperatorSubscriber } from 'rxjs/internal/operators/OperatorSubscriber';

type MessageOperatorOptions = {
  /**
   * If true, an empty response will be returned before a received message is
   * processed.
   */
  acknowledge: boolean;
};

class ZMessageService {
  private messages: Subject<ZMessage<MessageType>> = new Subject();
  private subscriptions = new WeakSet();

  constructor() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.messages.next({
        type: message?.type,
        payload: message?.payload,
        sender: { ...sender },
        sendResponse,
      });

      // return true to keep sendResponse around
      return true;
    });
  }

  addMessageOperator<T extends MessageType, R>(
    type: T,
    operator: (source: Observable<ZMessage<T>>) => Observable<R>,
    options?: MessageOperatorOptions,
  ): void {
    /**
     * Array cbs stores sendResponse() of incoming messages of the specified
     * type.
     *
     * As the callbacks will be retrieved FIFO, the processing order down
     * stream must be guaranteed.
     */
    let cbs: ZSendResponse<T>[] = [];

    const subscription = this.messages
      .pipe(
        filter((x): x is ZMessage<T> => x.type === type),

        tap((x) => {
          options?.acknowledge
            ? x.sendResponse({ ok: true })
            : cbs.push(x.sendResponse);
        }),

        operate<ZMessage<T>, R>((source, subscriber) => {
          operator(source).subscribe(createOperatorSubscriber(subscriber));
        }),

        tap({
          next: (data) =>
            !options?.acknowledge && cbs.shift()?.({ ok: true, data }),

          unsubscribe: () =>
            cbs.forEach((cb) => cb({ ok: false, reason: 'unsubscribed' })),
        }),
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }
}

const defaultMsgSvc = new ZMessageService();

/**
 * Returns a decorator that registers the annotated method with the messaging
 * service.
 *
 * @see {@link ZMessageService}
 */
export function zMessageOperator(
  type: MessageType,

  options: MessageOperatorOptions = {
    acknowledge: false,
  },
) {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    if (typeof descriptor.value === 'function') {
      defaultMsgSvc.addMessageOperator(
        type,
        (descriptor.value as Function).bind(target),
        options,
      );
    }
  };
}
