/**
 * Background is the service worker for the extension, which starts a "back end" in the background.
 * @module
 */

import { map, Observable } from 'rxjs';
// import { ServiceWorker } from '../ServiceWorker';
import { hotPeriodicMono } from '../rxutil';
import { today } from '../helper';
import {
  DbConst,
  LimitStore,
  LimitStoreImpl,
  PulseStore,
  PulseStoreImpl,
} from '../stores';
import { Report } from '../domain';

// old
// new ServiceWorker().start();

// bootstrap the "message queue"
import './messaging';
import './LimitService';
import './PulseService';

export const limitStore: LimitStore = new LimitStoreImpl(
  DbConst.DB_NAME,
  DbConst.LIMIT_STORENAME,
);

export const pulseStore: PulseStore = new PulseStoreImpl(
  DbConst.DB_NAME,
  DbConst.PULSE_STORENAME,
  DbConst.ORIGIN_TIME_IDX,
  DbConst.TIME_IDX,
);

export const todaysReportObservable: Observable<Report> = hotPeriodicMono(
  () => {
    const date = today();
    return pulseStore
      .findByDate(date)
      .pipe(map((x) => new Report(date, null, x)));
  },
);

function setUpSidePanel(): void {
  // Allows users to open the side panel by clicking on the action toolbar icon
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
}

setUpSidePanel();
