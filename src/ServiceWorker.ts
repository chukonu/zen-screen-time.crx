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
import { MessageType, Report } from './domain';
import _ from 'lodash';
import { hotPeriodicMono } from './rxutil';
import { today } from './helper';
import { PulseStore, PulseStoreImpl } from './stores';
import DbConst from './stores/db-constants';

/**
 * ServiceWorker serves as the gateway to the back end and is the service worker running in the background.
 *
 * @see {@link MessageType}
 */
export class ServiceWorker {
  #messages: Subject<{
    type: MessageType;
    payload: any;
    sender: chrome.runtime.MessageSender;
    sendResponse: (response?: any) => void;
  }> = new Subject();

  #dataRequests = this.#messages.pipe(
    filter((x) => x.type === MessageType.DataRequest),
    map(({ payload, sendResponse }) => ({ payload, sendResponse })),
  );

  #pulseMessages = this.#messages.pipe(
    filter((x) => x.type === MessageType.Pulse),
    // just acknowledge
    tap(({ sendResponse }) => sendResponse()),
    map((x) => x.payload as Pulse),
  );

  #limitChecks: Observable<{
    site: string;
    sendResponse: (response?: any) => void;
  }> = this.#messages.pipe(
    filter((x) => x.type === MessageType.LimitCheck),
    // extract website identity:
    map(({ sender, sendResponse }) => ({ site: sender.origin, sendResponse })),
  );

  #dataRequestSubscription: Subscription;
  #pulseSubscription: Subscription;
  #limitCheckSubscription: Subscription;

  readonly #dbName = 'zen';
  #pulseStore: PulseStore = new PulseStoreImpl(
    this.#dbName,
    DbConst.PULSE_STORENAME,
    DbConst.ORIGIN_TIME_IDX,
    DbConst.TIME_IDX,
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
            .pipe(tap((pulseArray) => sendResponse(pulseArray))),
        ),
      )
      .subscribe({
        next: (x) => console.debug('Query results: ', x),
        error: (err) => console.error('Error in querying screen time: ', err),
        complete: () => console.debug('Query completed'),
      });

    this.#limitCheckSubscription = this.#limitChecks
      .pipe(
        concatMap(({ site, sendResponse }) =>
          this.#todaysReportObservable.pipe(
            map((report) => report.durationBySite),
            map((X) => _(X.value).filter((x) => x.origin === site)),
            tap((x) => sendResponse(x)),
          ),
        ),
      )
      .subscribe();
  }

  stop() {
    this.#pulseSubscription?.unsubscribe();
    this.#pulseSubscription = undefined;

    this.#dataRequestSubscription?.unsubscribe();
    this.#dataRequestSubscription = undefined;

    this.#limitCheckSubscription?.unsubscribe();
    this.#limitCheckSubscription = undefined;
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
