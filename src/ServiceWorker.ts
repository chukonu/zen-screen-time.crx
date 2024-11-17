import {
  concatMap,
  filter,
  map,
  Observable,
  Subject,
  Subscription,
  tap,
} from 'rxjs';
import { Pulse } from './Pulse';
import { receiveAndStorePulses } from './pulse-operations';
import { MessageType, Report, ZMessage } from './domain';
import _ from 'lodash';
import { hotPeriodicMono } from './rxutil';
import { today } from './helper';
import {
  addLimitToStore,
  DbConst,
  LimitStore,
  LimitStoreImpl,
  PulseStore,
  PulseStoreImpl,
} from './stores';

/**
 * ServiceWorker serves as the gateway to the back end and is the service worker running in the background.
 *
 * @see {@link MessageType}
 */
export class ServiceWorker {
  #messages: Subject<ZMessage<MessageType>> = new Subject();

  #dataRequests = this.#messages.pipe(
    filter(
      (x): x is ZMessage<MessageType.DataRequest> =>
        x.type === MessageType.DataRequest,
    ),
  );

  #pulseMessages = this.#messages.pipe(
    filter(
      (x): x is ZMessage<MessageType.Pulse> => x.type === MessageType.Pulse,
    ),
    // just acknowledge
    tap(({ sendResponse }) => sendResponse({ ok: true })),
    map((x) => x.payload as Pulse),
  );

  #limitChecks = this.#messages.pipe(
    filter(
      (x): x is ZMessage<MessageType.LimitCheck> =>
        x.type === MessageType.LimitCheck,
    ),
  );

  #addLimit = this.#messages.pipe(
    filter(
      (x): x is ZMessage<MessageType.AddLimit> =>
        x.type === MessageType.AddLimit,
    ),
  );

  #dataRequestSubscription: Subscription;
  #pulseSubscription: Subscription;
  #limitCheckSubscription: Subscription;
  #addLimitSubscription: Subscription;

  readonly #dbName = 'zen';
  #pulseStore: PulseStore = new PulseStoreImpl(
    this.#dbName,
    DbConst.PULSE_STORENAME,
    DbConst.ORIGIN_TIME_IDX,
    DbConst.TIME_IDX,
  );

  #limitStore: LimitStore = new LimitStoreImpl(
    this.#dbName,
    DbConst.LIMIT_STORENAME,
  );

  #todaysReportObservable: Observable<Report> = hotPeriodicMono(() => {
    const date = today();
    return this.#pulseStore
      .findByDate(date)
      .pipe(map((x) => new Report(date, null, x)));
  });

  start() {
    this.#setUpSidePanel();
    this.#pipeMessages();

    this.#pulseSubscription = receiveAndStorePulses(
      this.#pulseMessages,
      this.#pulseStore,
    ).subscribe({
      error: (err) => console.error(`Error happened: `, err),
    });

    this.#dataRequestSubscription = this.#dataRequests
      .pipe(
        concatMap(({ payload, sendResponse }) =>
          this.#pulseStore
            .findByDate(payload.date as number)
            .pipe(tap((data) => sendResponse({ ok: true, data }))),
        ),
      )
      .subscribe({
        next: (x) => console.debug('Query results: ', x),
        error: (err) => console.error('Error in querying screen time: ', err),
        complete: () => console.debug('Query completed'),
      });

    this.#limitCheckSubscription = this.#limitChecks
      .pipe(
        concatMap(({ sender, sendResponse }) =>
          this.#todaysReportObservable.pipe(
            map((report) => report.durationBySite),
            map((xs) =>
              _(xs.value)
                .filter((x) => x.origin === sender.origin)
                .value(),
            ),
            tap((data) => sendResponse({ ok: true, data })),
          ),
        ),
      )
      .subscribe();

    this.#addLimitSubscription = this.#addLimit
      .pipe(addLimitToStore(this.#limitStore))
      .subscribe({
        complete: () =>
          console.debug('Stopped processing new limits, which is unexpected.'),
        error: (err) => console.error(err?.message ?? err),
        next: (x) => console.debug('Added a new limit successfully.', x),
      });
  }

  stop() {
    this.#pulseSubscription?.unsubscribe();
    this.#pulseSubscription = undefined;

    this.#dataRequestSubscription?.unsubscribe();
    this.#dataRequestSubscription = undefined;

    this.#limitCheckSubscription?.unsubscribe();
    this.#limitCheckSubscription = undefined;

    this.#addLimitSubscription?.unsubscribe();
    this.#addLimitSubscription = undefined;
  }

  #setUpSidePanel() {
    // Allows users to open the side panel by clicking on the action toolbar icon
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));
  }

  #pipeMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.#messages.next({
        type: message?.type,
        payload: message?.payload,
        sender: { ...sender },
        sendResponse,
      });

      // return true to keep sendResponse around
      return true;
    });
  }
}
