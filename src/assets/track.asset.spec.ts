import { beforeEach, describe, expect, it } from '@jest/globals';
import { cxDynamic, CxEntry, cxRecent } from '@proc7ts/context-values';
import { EventEmitter, EventSupplier, onSupplied } from '@proc7ts/fun-events';
import { valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxBuilder } from '../builder';
import { cxTrackAsset } from './track.asset';

describe('cxTrackAsset', () => {
  let builder: CxBuilder;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
  });

  describe('for `cxDynamic()` entry', () => {
    let entry: CxEntry<readonly number[], number>;

    beforeEach(() => {
      entry = {
        perContext: cxDynamic(),
        toString: () => '[CxEntry test]',
      };
    });

    it('supplies multiple assets', () => {
      const assets = new EventEmitter<number[]>();

      builder.provide(cxTrackAsset(entry, track(assets)));
      expect(builder.get(entry)).toEqual([]);

      assets.send(1, 2, 3);
      expect(builder.get(entry)).toEqual([1, 2, 3]);

      assets.send(4, 5);
      expect(builder.get(entry)).toEqual([4, 5]);
    });
  });

  describe('for `cxRecent()` entry', () => {
    let entry: CxEntry<number, number>;

    beforeEach(() => {
      entry = {
        perContext: cxRecent({ byDefault: valueProvider(0) }),
        toString: () => '[CxEntry test]',
      };
    });

    it('supplies most recent asset', () => {
      const assets = new EventEmitter<number[]>();

      builder.provide(cxTrackAsset(entry, track(assets)));
      expect(builder.get(entry)).toBe(0);

      assets.send(1, 2, 3);
      expect(builder.get(entry)).toBe(3);

      assets.send(4, 5);
      expect(builder.get(entry)).toBe(5);
    });
  });

  describe('for custom entry', () => {
    it('supplies only requested assets', () => {
      const entry: CxEntry<number> = {
        perContext(target) {
          return {
            assign(receiver) {
              target.eachAsset(asset => {
                receiver(asset);

                return false;
              });
            },
            assignDefault(receiver) {
              receiver(0);
            },
          };
        },
        toString: () => '[CxEntry test]',
      };

      const assets = new EventEmitter<number[]>();

      builder.provide(cxTrackAsset(entry, track(assets)));
      expect(builder.get(entry)).toBe(0);

      assets.send(1, 2, 3);
      expect(builder.get(entry)).toBe(1);

      assets.send(4, 5);
      expect(builder.get(entry)).toBe(4);
    });
  });

  function track<TValue, TAsset = TValue>(
    onAssets: EventSupplier<TAsset[]>,
  ): (
    target: CxEntry.Target<TValue, TAsset>,
    receiver: (...assets: TAsset[]) => void,
    supply: Supply,
  ) => void {
    return (_target, receiver, supply) => onSupplied(onAssets)({
        receive: (_, ...assets) => receiver(...assets),
        supply,
      });
  }
});
