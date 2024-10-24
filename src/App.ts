import { filter, map, Subject, Subscription } from 'rxjs';
import { Pulse } from './Pulse';
import { PulseStore } from './stores/pulse';
import { receiveAndStorePulses } from './pulse-operations';

/**
 * App is the service worker running in the background.
 */
export class App {
  #messages: Subject<{ type: string; payload: any }> = new Subject();

  #dataRequests = this.#messages.pipe(
    filter((x) => x.type === 'data_request'),
    map((x) => x.payload),
  );

  #pulseMessages = this.#messages.pipe(
    filter((x) => x.type === 'pulse'),
    map((x) => x.payload as Pulse),
  );

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
  }

  stop() {
    this.#pulseSubscription?.unsubscribe();
  }

  #setUpSidePanel() {
    // Allows users to open the side panel by clicking on the action toolbar icon
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));
  }

  #pipeMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
      this.#messages.next(message),
    );
  }
}
