import { beforeEach, describe, expect, it } from '@jest/globals';
import { cxEvaluated, CxReferenceError, CxValues } from '@proc7ts/context-values';
import { cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';

describe('cxArray', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
    context = builder.context;
  });

  it('provides nothing by default', () => {

    const entry = { perContext: cxEvaluated<string>(() => null) };

    expect(() => context.get(entry)).toThrow(new CxReferenceError(entry));
    expect(context.get(entry, { or: 'fallback' })).toBe('fallback');
  });
  it('provides default value if there is no provider', () => {

    const defaultValue = 'default';
    const entryWithDefaults = { perContext: cxEvaluated<string>(() => null, { byDefault: () => defaultValue }) };

    expect(context.get(entryWithDefaults)).toEqual(defaultValue);
  });
  it('provides evaluated value', () => {

    const entry = {
      perContext: cxEvaluated<string>(target => {

        let value = '';

        target.eachAsset(asset => {
          value += asset;
        });

        return value;
      }),
    };

    builder.provide(cxConstAsset(entry, 'a'));
    builder.provide(cxConstAsset(entry, 'b'));
    builder.provide(cxConstAsset(entry, 'c'));

    expect(context.get(entry)).toBe('abc');
  });
});
