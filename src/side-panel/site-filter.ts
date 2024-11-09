import { BehaviorSubject } from 'rxjs';

const siteFilterSubject = new BehaviorSubject<null | string>(null);

export function updateSiteFilter(siteFilter: null | string) {
  siteFilterSubject.next(siteFilter);
}

export const siteFilterObservable = siteFilterSubject.asObservable();

export default siteFilterObservable;
