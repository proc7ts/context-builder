import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxEntry, cxSingle, CxValues } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';
import { cxBuildAsset, cxConstAsset } from './assets';
import { CxBuilder } from './builder';

describe('CxAsset', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
    context = builder.context;
  });

  let builder2: CxBuilder;
  let context2: CxValues;

  beforeEach(() => {
    builder2 = new CxBuilder(get => ({ get }), builder);
    context2 = builder2.context;
  });

  describe('setupAsset', () => {
    it('performs additional setup', () => {

      const entry = { perContext: cxSingle<string>() };
      const nestedEntry = { perContext: cxSingle<string>() };
      const nestedSupply = new Supply();
      const supply = builder.provide({
        entry,
        placeAsset(_target, collector) {
          collector('test');
        },
        setupAsset(target) {
          target.provide(cxConstAsset(nestedEntry, 'nested', nestedSupply));
        },
      });

      expect(supply.isOff).toBe(false);
      expect(nestedSupply.isOff).toBe(false);
      expect(context.get(entry)).toBe('test');
      expect(context.get(nestedEntry)).toBe('nested');

      supply.off();
      expect(nestedSupply.isOff).toBe(true);
    });
  });

  describe('Provided', () => {
    describe('recentAsset', () => {
      it('returns most recent value asset', () => {

        const entry: CxEntry<number[], number> = {
          perContext(target) {

            let value: number[] = [];

            target.trackAssetList(assets => {

              const newValue: number[] = [];

              for (const { recentAsset } of assets) {
                if (recentAsset) {
                  newValue.push(recentAsset.asset);
                }
              }

              value = newValue;
            });

            return {
              assign(assigner) {
                assigner(value);
              },
            };
          },
        };

        builder2.provide(cxConstAsset(entry, 1));
        builder2.provide(cxBuildAsset(entry, () => null));
        builder.provide({
          entry: entry,
          placeAsset(_target, collector) {
            collector(11);
            collector(12);
            collector(13);
          },
        });

        expect(context2.get(entry)).toEqual([1, 13]);
      });
    });
    describe('eachRecentAsset', () => {
      it('iterates over assets in most-recent-first order', () => {

        const entry: CxEntry<number[], number> = {
          perContext(target) {

            let value: number[] = [];

            target.trackAssetList(assets => {

              const newValue: number[] = [];

              for (const provided of assets) {
                provided.eachRecentAsset(asset => {
                  newValue.push(asset);
                });
              }

              value = newValue;
            });

            return {
              assign(assigner) {
                assigner(value);
              },
            };
          },
        };

        builder2.provide(cxConstAsset(entry, 1));
        builder2.provide(cxBuildAsset(entry, () => null));
        builder.provide({
          entry: entry,
          placeAsset(_target, collector) {
            collector(11);
            collector(12);
            collector(13);
          },
        });

        expect(context2.get(entry)).toEqual([1, 13, 12, 11]);
      });
    });
  });
});
