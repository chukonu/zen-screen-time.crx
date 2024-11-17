import { ReactiveController } from 'lit';
import { Limit } from '../domain';

export { ReportController } from './report';

export interface LimitController extends ReactiveController {
  /**
   * Use pattern to filter data on the `value` property
   */
  pattern: string;
  /**
   * If pattern is undefined, value will be undefined.
   */
  value: Iterable<Limit>;

  addLimit(value: Limit): void;
}

export { default as LimitControllerImpl } from './LimitControllerImpl';
