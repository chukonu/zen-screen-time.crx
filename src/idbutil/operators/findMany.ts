import { noop, OperatorFunction } from 'rxjs';
import { createOperatorSubscriber } from 'rxjs/internal/operators/OperatorSubscriber';
import { operate } from 'rxjs/internal/util/lift';

export default function findMany<T>(
  storeName: string,
  indexName: string,
  query: IDBKeyRange | null,
): OperatorFunction<IDBTransaction, T> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (t) => {
          const req = t
            .objectStore(storeName)
            .index(indexName)
            .openCursor(query);

          req.onsuccess = function (event) {
            const cursor = this.result;
            if (!cursor) {
              subscriber.complete();
            } else {
              subscriber.next(cursor.value as T);
              cursor.continue();
            }
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
