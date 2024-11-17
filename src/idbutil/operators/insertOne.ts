import { noop, OperatorFunction } from 'rxjs';
import { createOperatorSubscriber } from 'rxjs/internal/operators/OperatorSubscriber';
import { operate } from 'rxjs/internal/util/lift';

/**
 * Insert one value to an object store
 * @returns the key of the newly inserted value
 */
export default function insertOne<T>(
  value: T,
  store: string,
): OperatorFunction<IDBTransaction, IDBValidKey> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (t) => {
          const req = t.objectStore(store).add(value);
          req.onsuccess = function (event) {
            subscriber.next(this.result);
            subscriber.complete();
          };
          req.onerror = function (event) {
            subscriber.error(this.error);
          };
        },
        noop,
      ),
    );
  });
}
