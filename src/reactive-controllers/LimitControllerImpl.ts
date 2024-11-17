import { ReactiveControllerHost } from 'lit';
import { LimitController } from '.';
import { Limit } from '../domain';

export default class LimitControllerImpl implements LimitController {
  private _pattern?: string;

  constructor(private readonly host: ReactiveControllerHost) {
    host.addController(this);
  }

  get pattern(): string {
    return this._pattern;
  }

  set pattern(v: string) {
    this._pattern = v;
  }

  value: Iterable<Limit>;

  addLimit(value: Limit): void {
    throw new Error('Method not implemented.');
  }
  hostConnected?(): void {
    throw new Error('Method not implemented.');
  }
  hostDisconnected?(): void {
    throw new Error('Method not implemented.');
  }
  hostUpdate?(): void {
    throw new Error('Method not implemented.');
  }
  hostUpdated?(): void {
    throw new Error('Method not implemented.');
  }
}
