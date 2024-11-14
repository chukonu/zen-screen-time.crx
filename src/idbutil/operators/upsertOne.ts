import { noop, OperatorFunction, UnaryFunction } from 'rxjs';
import { createOperatorSubscriber } from 'rxjs/internal/operators/OperatorSubscriber';
import { operate } from 'rxjs/internal/util/lift';

export default function upsertOne<T>(
  storeName: string,
  indexName: string,
  query: IDBKeyRange | null,
  /**
   * A function that returns the new value. If there is no existing record
   * matching query, a null value will be passed in.
   */
  update: UnaryFunction<T | null, T>,
): OperatorFunction<IDBTransaction, IDBValidKey> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(
        subscriber,
        (t) => {
          /**
           * request to open a cursor
           */
          const rc = t
            .objectStore(storeName)
            .index(indexName)
            .openCursor(query);

          rc.onsuccess = function (event) {
            const cursor = this.result;
            if (!cursor) {
              /**
               * request to add a new value
               */
              const value = update(null);
              const ra = t.objectStore(storeName).add(value);

              ra.onsuccess = function (event) {
                const id = this.result;
                subscriber.next(id);
                subscriber.complete();
              };

              ra.onerror = function (event) {
                subscriber.error(this.error);
              };
            } else {
              /**
               * request to update value at cursor
               */
              const value = update(cursor.value);
              const ru = cursor.update(value);

              ru.onsuccess = function (event) {
                subscriber.next(this.result);
                subscriber.complete();
              };

              ru.onerror = function (event) {
                subscriber.error(this.error);
              };
            }
          };

          rc.onerror = function (event) {
            subscriber.error(this.error);
          };
        },
        noop,
      ),
    );
  });
}
