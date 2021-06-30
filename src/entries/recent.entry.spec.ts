import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { CxEntry, cxRecent, CxReferenceError, CxValues } from '@proc7ts/context-values';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { cxBuildAsset, cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';
import { CxSupply } from './supply';

describe('cxRecent', () => {

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

  describe('with default value', () => {

    let entry: CxEntry<string>;

    beforeEach(() => {
      entry = { perContext: cxRecent({ byDefault: () => 'default' }), toString: () => '[CxEntry test]' };
    });

    it('provides default value initially', () => {
      expect(context.get(entry)).toBe('default');
    });
    it('throws without default value', () => {
      entry = { perContext: cxRecent(), toString: () => '[CxEntry test]' };
      expect(() => context.get(entry)).toThrow(new CxReferenceError(entry, 'The [CxEntry test] is unavailable'));
    });
    it('provides the most recent value', () => {
      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2'));

      expect(context.get(entry)).toBe('value2');
    });
    it('updates the value with most recent asset', () => {
      expect(context.get(entry)).toBe('default');

      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2'));

      expect(context.get(entry)).toBe('value2');
    });
    it('switches to next most recent asset when previous one removed', () => {
      expect(context.get(entry)).toBe('default');

      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2')).off();

      expect(context.get(entry)).toBe('value1');
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
      expect(context.get(entry)).toBe('default');

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

      it('updates the value with most recent asset', () => {
        expect(context2.get(entry)).toBe('default');

        builder.provide(cxConstAsset(entry, 'value1'));
        builder2.provide(cxBuildAsset(entry, () => 'value2'));

        expect(context2.get(entry)).toBe('value2');
      });
      it('updates the value with most recent asset from derived context', () => {
        expect(context2.get(entry)).toBe('default');

        builder.provide(cxConstAsset(entry, 'value1'));

        expect(context2.get(entry)).toBe('value1');
      });
      it('switches to next most recent asset from derived context when previous one removed', () => {
        expect(context2.get(entry)).toBe('default');

        builder.provide(cxConstAsset(entry, 'value1'));
        expect(context2.get(entry)).toBe('value1');

        const supply = builder2.provide(cxConstAsset(entry, 'value2'));

        expect(context2.get(entry)).toBe('value2');

        supply.off();
        expect(context2.get(entry)).toBe('value1');
      });
    });
  });

  describe('with internal state', () => {

    let entry: CxEntry<string>;

    beforeEach(() => {
      entry = {
        perContext: cxRecent<string, string, { message: string }>({
          create: recent => ({ message: recent }),
          byDefault: () => ({ message: 'default' }),
          access: get => () => get().message + '!',
        }),
      };
    });

    it('provides default value initially', () => {
      expect(context.get(entry)).toBe('default!');
    });
    it('provides the most recent value', () => {
      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2'));

      expect(context.get(entry)).toBe('value2!');
    });
    it('updates the value with most recent asset', () => {
      expect(context.get(entry)).toBe('default!');

      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2'));

      expect(context.get(entry)).toBe('value2!');
    });
    it('switches to next most recent asset when previous one removed', () => {
      expect(context.get(entry)).toBe('default!');

      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2')).off();

      expect(context.get(entry)).toBe('value1!');
    });
    it('does not change the value when non-recent asset when previous one removed', () => {
      expect(context.get(entry)).toBe('default!');

      const supply = builder.provide(cxConstAsset(entry, 'value1'));

      builder.provide(cxConstAsset(entry, 'value2'));
      supply.off();

      expect(context.get(entry)).toBe('value2!');
    });

    describe('context derivation', () => {

      let builder2: CxBuilder;
      let context2: CxValues;

      beforeEach(() => {
        builder2 = new CxBuilder<CxValues>(get => ({ get }), builder);
        context2 = builder2.context;
      });

      it('updates the value with most recent asset', () => {
        expect(context2.get(entry)).toBe('default!');

        builder.provide(cxConstAsset(entry, 'value1'));
        builder2.provide(cxBuildAsset(entry, () => null));

        expect(context2.get(entry)).toBe('value1!');
      });
      it('updates the value with most recent asset from derived context', () => {
        expect(context2.get(entry)).toBe('default!');

        builder.provide(cxConstAsset(entry, 'value1'));

        expect(context2.get(entry)).toBe('value1!');
      });
      it('switches to next most recent asset from derived context when previous one removed', () => {
        expect(context2.get(entry)).toBe('default!');

        builder.provide(cxConstAsset(entry, 'value1'));
        expect(context2.get(entry)).toBe('value1!');

        const supply = builder2.provide(cxConstAsset(entry, 'value2'));

        expect(context2.get(entry)).toBe('value2!');

        supply.off();
        expect(context2.get(entry)).toBe('value1!');
      });
      it('does not change the value when asset removed from previous context', () => {
        expect(context2.get(entry)).toBe('default!');

        const supply = builder.provide(cxConstAsset(entry, 'value1'));

        builder.provide(cxConstAsset(entry, 'value2'));
        supply.off();

        expect(context.get(entry)).toBe('value2!');
      });
    });
  });
});
