import { OperatorFunction } from 'rxjs';
import { createOperatorSubscriber } from 'rxjs/internal/operators/OperatorSubscriber';
import { operate } from 'rxjs/internal/util/lift';

export default function transaction(
  storeNames: string | Iterable<string>,
  mode: IDBTransactionMode = 'readwrite',
): OperatorFunction<IDBDatabase, IDBTransaction> {
  return operate((source, subscriber) => {
    source.subscribe(
      createOperatorSubscriber(subscriber, (db) => {
        const transaction = db.transaction(storeNames, mode);
        transaction.oncomplete = function (event) {
          console.debug('Transaction completed');
          subscriber.complete();
        };
        transaction.onerror = function (event) {
          subscriber.error(this.error);
        };
        subscriber.next(transaction);
      }),
    );
  });
}
