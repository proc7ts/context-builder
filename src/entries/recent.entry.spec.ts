import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { CxEntry, cxRecent, CxReferenceError, CxRequestMethod, CxTracker, CxValues } from '@proc7ts/context-values';
import { asis, noop, valueProvider } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { cxBuildAsset, cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';

describe('cxRecent', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder<CxValues>(get => ({ get }));
    context = builder.context;
  });

  beforeEach(() => {
    Supply.onUnexpectedAbort(noop);
  });
  afterEach(() => {
    Supply.onUnexpectedAbort();
  });

  describe('without default value', () => {

    let entry: CxEntry<string>;

    beforeEach(() => {
      entry = { perContext: cxRecent(), toString: () => '[CxEntry test]' };
    });

    it('throws on access', () => {
      expect(() => context.get(entry)).toThrow(new CxReferenceError(entry));
    });
    it('supports `Assets` request method', () => {
      expect(() => context.get(entry, { by: CxRequestMethod.Assets })).toThrow(new CxReferenceError(entry));
      expect(context.get(entry, { by: CxRequestMethod.Assets, or: null })).toBeNull();

      builder.provide(cxConstAsset(entry, 'test'));
      expect(context.get(entry, { by: CxRequestMethod.Assets })).toBe('test');
      expect(context.get(entry, { by: CxRequestMethod.Assets, or: null })).toBe('test');
    });
    it('supports `Defaults` request method', () => {
      expect(() => context.get(entry, { by: CxRequestMethod.Defaults })).toThrow(new CxReferenceError(entry));
      expect(context.get(entry, { by: CxRequestMethod.Defaults, or: null })).toBeNull();

      builder.provide(cxConstAsset(entry, 'test'));
      expect(() => context.get(entry, { by: CxRequestMethod.Defaults })).toThrow(new CxReferenceError(entry));
      expect(context.get(entry, { by: CxRequestMethod.Defaults, or: null })).toBeNull();
    });
  });

  describe('with default value', () => {

    let entry: CxEntry<string>;

    beforeEach(() => {
      entry = { perContext: cxRecent({ byDefault: () => 'default' }), toString: () => '[CxEntry test]' };
    });

    it('provides default value initially', () => {
      expect(context.get(entry)).toBe('default');
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

      builder.supply.off(reason);

      expect(() => context.get(entry)).toThrow(new CxReferenceError(
          entry,
          'The [CxEntry test] is unavailable',
          reason,
      ));
    });
    it('becomes unavailable after context disposal', () => {
      expect(context.get(entry)).toBe('default');

      const reason = new Error('Disposed');

      builder.supply.off(reason);

      expect(() => context.get(entry)).toThrow(new CxReferenceError(
          entry,
          'The [CxEntry test] is unavailable',
          reason,
      ));
    });
    it('supports `Assets` request method', () => {
      expect(() => context.get(entry, { by: CxRequestMethod.Assets }))
          .toThrow(new CxReferenceError(entry, 'No value provided for [CxEntry test]'));
      expect(context.get(entry, { by: CxRequestMethod.Assets, or: null })).toBeNull();

      builder.provide(cxConstAsset(entry, 'test'));
      expect(context.get(entry, { by: CxRequestMethod.Assets })).toBe('test');
      expect(context.get(entry, { by: CxRequestMethod.Assets, or: null })).toBe('test');
    });
    it('supports `Defaults` request method', () => {
      expect(context.get(entry, { by: CxRequestMethod.Defaults })).toBe('default');
      expect(context.get(entry, { by: CxRequestMethod.Defaults, or: null })).toBe('default');

      builder.provide(cxConstAsset(entry, 'test'));
      expect(context.get(entry, { by: CxRequestMethod.Defaults })).toBe('default');
      expect(context.get(entry, { by: CxRequestMethod.Defaults, or: null })).toBe('default');
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
          assign: ({ to }) => receiver => to(({ message }, by) => receiver(message + '!', by)),
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

  describe('tracking with default value', () => {

    let entry: CxEntry<CxTracker.Mandatory<string>, string>;

    beforeEach(() => {
      entry = {
        perContext: cxRecent<CxTracker.Mandatory<string>, string, string>({
          create: asis,
          byDefault: valueProvider('default'),
          assign: tracker => receiver => receiver(tracker),
        }),
        toString: () => '[CxEntry test]',
      };
    });

    it('tracks value changes', () => {

      let current!: string;
      let currentMethod!: CxRequestMethod;

      context.get(entry).track((value, by) => {
        current = value;
        currentMethod = by;
      });

      expect(current).toBe('default');
      expect(currentMethod).toBe(CxRequestMethod.Defaults);

      const supply = builder.provide(cxConstAsset(entry, 'test'));

      expect(current).toBe('test');
      expect(currentMethod).toBe(CxRequestMethod.Assets);

      supply.off();
      expect(current).toBe('default');
      expect(currentMethod).toBe(CxRequestMethod.Defaults);
    });
  });

  describe('tracking without default value', () => {

    let entry: CxEntry<CxTracker<string>, string>;

    beforeEach(() => {
      entry = {
        perContext: cxRecent<CxTracker<string>, string, string>({
          create: asis,
          assign: tracker => receiver => receiver(tracker),
        }),
        toString: () => '[CxEntry test]',
      };
    });

    it('tracks value changes', () => {

      let current: string | undefined;
      let currentMethod: CxRequestMethod | undefined;

      context.get(entry).track((value?, by?) => {
        current = value;
        currentMethod = by;
      });

      expect(current).toBeUndefined();
      expect(currentMethod).toBeUndefined();

      const supply = builder.provide(cxConstAsset(entry, 'test'));

      expect(current).toBe('test');
      expect(currentMethod).toBe(CxRequestMethod.Assets);

      supply.off();
      expect(current).toBeUndefined();
      expect(currentMethod).toBeUndefined();
    });
  });
});
