import { OperatorFunction } from 'rxjs';
import { LimitStore } from '..';
import { operate } from 'rxjs/internal/util/lift';
import { MessageType, ZMessage } from '../../domain';
import { createOperatorSubscriber } from 'rxjs/internal/operators/OperatorSubscriber';

export default function addLimitToStore(
  store: LimitStore,
): OperatorFunction<ZMessage<MessageType.AddLimit>, IDBValidKey> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(subscriber, (msg) => {
        store.insertOne(msg.payload).subscribe(subscriber);
      }),
    );
  });
}
