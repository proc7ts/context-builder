import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CxEntry, CxReferenceError, cxSingle, CxValues } from '@proc7ts/context-values';
import { noop } from '@proc7ts/primitives';
import { cxBuildAsset, cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';

describe('cxSingle', () => {
  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder<CxValues>(get => ({ get }));
    context = builder.context;
  });

  let entry: CxEntry<string>;

  beforeEach(() => {
    entry = { perContext: cxSingle() };
  });

  it('provides value', () => {
    const value = 'test value';

    builder.provide(cxConstAsset(entry, value));

    expect(context.get(entry)).toBe(value);
  });
  it('selects the last provided value if more than one provided', () => {
    const value1 = 'value1';
    const value2 = 'value2';

    builder.provide(cxConstAsset(entry, value1));
    builder.provide(cxConstAsset(entry, value2));
    builder.provide(cxConstAsset(entry, null));

    expect(context.get(entry)).toBe(value2);
  });
  it('removes the asset', () => {
    const value1 = 'value1';
    const value2 = 'value2';

    builder.provide(cxConstAsset(entry, value1));
    builder.provide(cxConstAsset(entry, value2)).off();

    expect(context.get(entry)).toBe(value1);
  });
  it('retains the constructed value when asset removed', () => {
    const value1 = 'value1';
    const value2 = 'value2';

    builder.provide(cxConstAsset(entry, value1));

    const supply = builder.provide(cxConstAsset(entry, value2));

    expect(context.get(entry)).toBe(value2);

    supply.off();
    expect(context.get(entry)).toBe(value2);
  });
  it('throws if there is neither default nor fallback value', () => {
    const entry1 = { perContext: cxSingle() };

    expect(() => context.get(entry1)).toThrow(new CxReferenceError(entry1));

    const entry2 = { perContext: cxSingle() };

    expect(() => context.get(entry2, {})).toThrow(new CxReferenceError(entry2));
  });
  it('provides fallback value if there is no provider', () => {
    expect(context.get(entry, { or: 'fallback' })).toBe('fallback');
  });
  it('provides fallback value when all provided values are `null` or `undefined`', () => {
    builder.provide(cxConstAsset(entry, null));
    builder.provide(cxBuildAsset(entry, noop));

    expect(context.get(entry, { or: 'miss' })).toBe('miss');
  });
  it('provides default value if no value provided', () => {
    const defaultValue = 'default';
    const byDefault = jest.fn((_target: CxEntry.Target<string>) => defaultValue);
    const entryWithDefaults = { perContext: cxSingle({ byDefault }) };

    builder.provide(cxConstAsset(entryWithDefaults, null));

    expect(context.get(entryWithDefaults)).toBe(defaultValue);
    expect(byDefault).toHaveBeenCalledWith(
      expect.objectContaining({ entry: entryWithDefaults, context }),
    );
  });
  it('provides default value if there is no provider', () => {
    expect(context.get({ perContext: cxSingle({ byDefault: () => 'default' }) })).toBe('default');
  });
  it('prefers fallback value over default one', () => {
    expect(
      context.get({ perContext: cxSingle({ byDefault: () => 'default' }) }, { or: 'fallback' }),
    ).toBe('fallback');
  });
  it('prefers default value if fallback one is absent', () => {
    expect(context.get({ perContext: cxSingle({ byDefault: () => 'default' }) }, {})).toBe(
      'default',
    );
  });
  it('prefers `null` fallback value over default one', () => {
    expect(
      context.get({ perContext: cxSingle({ byDefault: () => 'default' }) }, { or: null }),
    ).toBeNull();
  });
  it('caches the value', () => {
    const value = 'value';
    const mockProvider = jest.fn(() => value);

    builder.provide(cxBuildAsset(entry, mockProvider));

    expect(context.get(entry)).toBe(value);
    expect(context.get(entry)).toBe(value);

    expect(mockProvider).toHaveBeenCalledTimes(1);
  });
  it('caches default value', () => {
    const value = 'default value';
    const defaultProviderSpy = jest.fn(() => value);
    const entryWithDefault = { perContext: cxSingle({ byDefault: defaultProviderSpy }) };

    expect(context.get(entryWithDefault)).toBe(value);
    expect(context.get(entryWithDefault)).toBe(value);
    expect(defaultProviderSpy).toHaveBeenCalledTimes(1);
  });
  it('does not cache fallback value', () => {
    const value1 = 'value1';
    const value2 = 'value2';

    expect(context.get(entry, { or: value1 })).toBe(value1);
    expect(context.get(entry, { or: value2 })).toBe(value2);
  });
  it('rebuilds the value in another context', () => {
    const value1 = 'value1';
    const value2 = 'value2';
    const mockProvider = jest.fn(() => value1);

    builder.provide(cxBuildAsset(entry, mockProvider));
    expect(context.get(entry)).toBe(value1);

    const builder2 = new CxBuilder(get => ({ get }), builder);
    const context2 = builder2.context;

    mockProvider.mockReturnValue(value2);
    expect(context.get(entry)).toBe(value1);
    expect(context2.get(entry)).toBe(value2);

    expect(mockProvider).toHaveBeenCalledTimes(2);
  });
});
