import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxBuilder } from '../builder';

export class CxBuilder$Cache implements CxBuilder.Cache {

  private readonly _ = new Map<unknown, unknown>();

  get(key: unknown): unknown | undefined {
    return this._.get(key);
  }

  put(key: unknown, value: unknown, supply: Supply): void {
    this._.set(key, value);
    supply.whenOff(() => this._.delete(key));
  }

}

export const CxBuilder$NoCache: CxBuilder.Cache = {
  get: noop,
  put: noop,
};
