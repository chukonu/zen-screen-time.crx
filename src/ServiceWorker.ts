import {
  concatMap,
  filter,
  last,
  map,
  scan,
  Subject,
  Subscription,
  tap,
} from 'rxjs';
import { Pulse } from './Pulse';
import { PulseStore } from './stores/pulse';
import { receiveAndStorePulses } from './pulse-operations';

/**
 * ServiceWorker serves as the gateway to the back end and is the service worker running in the background.
 */
export class ServiceWorker {
  #messages: Subject<{
    type: string;
    payload: any;
    sendResponse: (response?: any) => void;
  }> = new Subject();

  #dataRequests = this.#messages.pipe(
    filter((x) => x.type === 'data_request'),
    map(({ payload, sendResponse }) => ({ payload, sendResponse })),
  );

  #pulseMessages = this.#messages.pipe(
    filter((x) => x.type === 'pulse'),
    // just acknowledge
    tap(({ sendResponse }) => sendResponse()),
    map((x) => x.payload as Pulse),
  );

  #dataRequestSubscription: Subscription;
  #pulseSubscription: Subscription;

  readonly #dbName = 'zen';
  #pulseStore = new PulseStore(this.#dbName);

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
          this.#pulseStore.query(payload.date as number).pipe(
            scan((arr: Pulse[], pulse) => Array.of(...arr, pulse), []),
            last(),

            // sort array descendingly by duration
            map((x) => x.sort((a, b) => b.duration - a.duration)),

            tap((pulseArray) => sendResponse(pulseArray)),
          ),
        ),
      )
      .subscribe({
        next: (x) => console.debug('Query results: ', x),
        error: (err) => console.error('Error in querying screen time: ', err),
        complete: () => console.debug('Query completed'),
      });
  }

  stop() {
    this.#pulseSubscription?.unsubscribe();
    this.#dataRequestSubscription?.unsubscribe();
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
        sendResponse,
      });

      // return true to keep sendResponse around
      return true;
    });
  }
}
