import { concatMap, map, Observable } from 'rxjs';
import { MessageType, ResponseDataOf, ZMessage } from '../domain';
import { zMessageOperator } from './messaging';
import { limitStore, todaysReportObservable } from '.';
import _ from 'lodash';

class LimitService {
  @zMessageOperator(MessageType.AddLimit)
  static addLimitToStore(
    source: Observable<ZMessage<MessageType.AddLimit>>,
  ): Observable<ResponseDataOf<MessageType.AddLimit>> {
    return source.pipe(concatMap((msg) => limitStore.insertOne(msg.payload)));
  }

  @zMessageOperator(MessageType.LimitCheck)
  static checkLimit(
    source: Observable<ZMessage<MessageType.LimitCheck>>,
  ): Observable<ResponseDataOf<MessageType.LimitCheck>> {
    return source.pipe(
      concatMap((msg) =>
        todaysReportObservable.pipe(
          map((report) => report.durationBySite),
          map((xs) =>
            _(xs.value)
              .filter((x) => x.origin === msg.sender.origin)
              .value(),
          ),
        ),
      ),
    );
  }

  @zMessageOperator(MessageType.FindLimitsForSite)
  static findLimitsForSite(
    source: Observable<ZMessage<MessageType.FindLimitsForSite>>,
  ): Observable<ResponseDataOf<MessageType.FindLimitsForSite>> {
    return source.pipe(map((_) => []));
  }
}
