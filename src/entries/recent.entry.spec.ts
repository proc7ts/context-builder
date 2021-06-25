import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxEntry, cxRecent, CxValues } from '@proc7ts/context-values';
import { cxBuildAsset, cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';

describe('cxRecent', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder<CxValues>(get => ({ get }));
    context = builder.context;
  });

  describe('with default value', () => {

    let entry: CxEntry<string>;

    beforeEach(() => {
      entry = { perContext: cxRecent({ byDefault: () => 'default' }) };
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

  describe('with custom updater', () => {

    let entry: CxEntry<string>;

    beforeEach(() => {
      entry = {
        perContext: cxRecent({
          createUpdater() {

            let value = 'initial';

            return {
              get() {
                return value;
              },
              set(asset) {
                value = `${asset}!`;
              },
              reset() {
                value = 'default';
              },
            };
          },
        }),
      };
    });

    it('provides default value initially', () => {
      expect(context.get(entry)).toBe('default');
    });
    it('provides the most recent value', () => {
      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2'));

      expect(context.get(entry)).toBe('value2!');
    });
    it('updates the value with most recent asset', () => {
      expect(context.get(entry)).toBe('default');

      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2'));

      expect(context.get(entry)).toBe('value2!');
    });
    it('switches to next most recent asset when previous one removed', () => {
      expect(context.get(entry)).toBe('default');

      builder.provide(cxConstAsset(entry, 'value1'));
      builder.provide(cxConstAsset(entry, 'value2')).off();

      expect(context.get(entry)).toBe('value1!');
    });
    it('does not change the value when non-recent asset when previous one removed', () => {
      expect(context.get(entry)).toBe('default');

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
        expect(context2.get(entry)).toBe('default');

        builder.provide(cxConstAsset(entry, 'value1'));
        builder2.provide(cxBuildAsset(entry, () => null));

        expect(context2.get(entry)).toBe('value1!');
      });
      it('updates the value with most recent asset from derived context', () => {
        expect(context2.get(entry)).toBe('default');

        builder.provide(cxConstAsset(entry, 'value1'));

        expect(context2.get(entry)).toBe('value1!');
      });
      it('switches to next most recent asset from derived context when previous one removed', () => {
        expect(context2.get(entry)).toBe('default');

        builder.provide(cxConstAsset(entry, 'value1'));
        expect(context2.get(entry)).toBe('value1!');

        const supply = builder2.provide(cxConstAsset(entry, 'value2'));

        expect(context2.get(entry)).toBe('value2!');

        supply.off();
        expect(context2.get(entry)).toBe('value1!');
      });
      it('does not change the value when asset removed from previous context', () => {
        expect(context2.get(entry)).toBe('default');

        const supply = builder.provide(cxConstAsset(entry, 'value1'));

        builder.provide(cxConstAsset(entry, 'value2'));
        supply.off();

        expect(context.get(entry)).toBe('value2!');
      });
    });
  });
});
