import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { cxDynamic, CxEntry, CxReferenceError, CxValues } from '@proc7ts/context-values';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { cxBuildAsset, cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';
import { CxSupply } from './supply';

describe('cxDynamic', () => {

  let builder: CxBuilder;
  let context: CxValues;
  let cxSupply: CxSupply;

  beforeEach(() => {
    cxSupply = new Supply();
    builder = new CxBuilder<CxValues>(get => ({ get, supply: cxSupply }));
    context = builder.context;
  });

  beforeEach(() => {
    Supply.onUnexpectedAbort(noop);
  });
  afterEach(() => {
    Supply.onUnexpectedAbort();
  });

  describe('array-valued', () => {

    let entry: CxEntry<readonly number[], number>;

    beforeEach(() => {
      entry = { perContext: cxDynamic(), toString: () => '[CxEntry test]' };
    });

    it('provides empty array initially', () => {
      expect(context.get(entry)).toEqual([]);
    });
    it('provides array of all assets', () => {
      builder.provide(cxConstAsset(entry, 1));
      builder.provide(cxConstAsset(entry, 2));

      expect(context.get(entry)).toEqual([1, 2]);
    });
    it('updates the value with provided assets', () => {
      expect(context.get(entry)).toEqual([]);

      builder.provide(cxConstAsset(entry, 1));
      builder.provide(cxConstAsset(entry, 2));

      expect(context.get(entry)).toEqual([1, 2]);
    });
    it('updates the value when asset revoked', () => {
      expect(context.get(entry)).toEqual([]);

      const supply = builder.provide(cxConstAsset(entry, 1));

      builder.provide(cxConstAsset(entry, 2));
      supply.off();

      expect(context.get(entry)).toEqual([2]);
    });
    it('is unavailable if context disposed', () => {

      const reason = new Error('Disposed');

      cxSupply.off(reason);

      expect(() => context.get(entry)).toThrow(new CxReferenceError(
          entry,
          'The [CxEntry test] is unavailable',
          reason,
      ));
    });
    it('becomes unavailable after context disposal', () => {
      expect(context.get(entry)).toEqual([]);

      const reason = new Error('Disposed');

      cxSupply.off(reason);

      expect(() => context.get(entry)).toThrow(new CxReferenceError(
          entry,
          'The [CxEntry test] is unavailable',
          reason,
      ));
    });

    describe('context derivation', () => {

      let builder2: CxBuilder;
      let context2: CxValues;

      beforeEach(() => {
        builder2 = new CxBuilder<CxValues>(get => ({ get }), builder);
        context2 = builder2.context;
      });

      it('updates the value with assets provided in all contexts', () => {
        expect(context2.get(entry)).toEqual([]);

        builder.provide(cxConstAsset(entry, 1));
        builder2.provide(cxBuildAsset(entry, () => 2));

        expect(context2.get(entry)).toEqual([1, 2]);
      });
      it('updates the value when asset revoked from parent context', () => {
        expect(context2.get(entry)).toEqual([]);

        const supply = builder.provide(cxConstAsset(entry, 1));

        expect(context2.get(entry)).toEqual([1]);

        builder2.provide(cxConstAsset(entry, 2));
        expect(context2.get(entry)).toEqual([1, 2]);

        supply.off();
        expect(context2.get(entry)).toEqual([2]);
      });
    });
  });

  describe('with internal state', () => {

    let entry: CxEntry<number, number>;

    beforeEach(() => {
      entry = {
        perContext: cxDynamic<number, number, { sum: number }>({
          create: assets => ({ sum: assets.reduce((prev, asset) => prev + asset, 0) }),
          byDefault: () => ({ sum: 0 }),
          access: get => () => get().sum,
        }),
      };
    });

    it('provides default value initially', () => {
      expect(context.get(entry)).toBe(0);
    });
    it('provides the value based on assets', () => {
      builder.provide(cxConstAsset(entry, 1));
      builder.provide(cxConstAsset(entry, 2));

      expect(context.get(entry)).toBe(3);
    });
    it('updates the value with provided assets', () => {
      expect(context.get(entry)).toBe(0);

      builder.provide(cxConstAsset(entry, 1));
      builder.provide(cxConstAsset(entry, 2));

      expect(context.get(entry)).toBe(3);
    });
    it('updates the value when asset revoked', () => {
      expect(context.get(entry)).toBe(0);

      const supply = builder.provide(cxConstAsset(entry, 1));

      builder.provide(cxConstAsset(entry, 2));
      supply.off();

      expect(context.get(entry)).toBe(2);
    });
    it('resets the value when all assets revoked', () => {
      expect(context.get(entry)).toBe(0);

      const supply1 = builder.provide(cxConstAsset(entry, 1));
      const supply2 = builder.provide(cxConstAsset(entry, 2));

      supply1.off();
      supply2.off();

      expect(context.get(entry)).toBe(0);
    });

    describe('context derivation', () => {

      let builder2: CxBuilder;
      let context2: CxValues;

      beforeEach(() => {
        builder2 = new CxBuilder<CxValues>(get => ({ get }), builder);
        context2 = builder2.context;
      });

      it('updates the value with provided assets', () => {
        expect(context2.get(entry)).toBe(0);

        builder.provide(cxConstAsset(entry, 1));
        builder2.provide(cxBuildAsset(entry, () => null));

        expect(context2.get(entry)).toBe(1);
      });
      it('updates the value when asset revoked from parent context', () => {
        expect(context2.get(entry)).toBe(0);

        const supply = builder.provide(cxConstAsset(entry, 1));

        expect(context2.get(entry)).toBe(1);

        builder2.provide(cxConstAsset(entry, 2));
        expect(context2.get(entry)).toBe(3);

        supply.off();
        expect(context2.get(entry)).toBe(2);
      });
    });
  });
});
