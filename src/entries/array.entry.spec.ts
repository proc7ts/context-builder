import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cxArray, CxEntry, CxReferenceError, CxValues } from '@proc7ts/context-values';
import { noop } from '@proc7ts/primitives';
import { cxBuildAsset, cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';

describe('cxArray', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
    context = builder.context;
  });

  let entry: CxEntry<readonly string[], string>;

  beforeEach(() => {
    entry = { perContext: cxArray() };
  });

  it('provides empty array by default', () => {
    expect(context.get(entry)).toEqual([]);
  });
  it('provides empty array if providers did not return any values', () => {
    builder.provide(cxConstAsset(entry, null));
    builder.provide(cxConstAsset(entry, undefined));

    expect(context.get(entry)).toEqual([]);
  });
  it('provides default value if there is no provider', () => {

    const defaultValue = ['default'];
    const entryWithDefaults = { perContext: cxArray({ byDefault: () => defaultValue }) };

    expect(context.get(entryWithDefaults)).toEqual(defaultValue);
  });
  it('provides default value if providers did not return any values', () => {

    const defaultValue = ['default'];
    const byDefault = jest.fn((_target: CxEntry.Target<readonly string[], string>) => defaultValue);
    const entryWithDefaults = { perContext: cxArray({ byDefault }) };

    builder.provide(cxConstAsset(entryWithDefaults, null));
    builder.provide(cxConstAsset(entryWithDefaults, undefined));

    expect(context.get(entryWithDefaults)).toEqual(defaultValue);
    expect(byDefault).toHaveBeenCalledWith(expect.objectContaining({ context, entry: entryWithDefaults }));
  });
  it('provides multiple values', () => {
    builder.provide(cxConstAsset(entry, 'a'));
    builder.provide(cxBuildAsset(entry, noop));
    builder.provide(cxConstAsset(entry, 'c'));

    expect([...context.get(entry)]).toEqual(['a', 'c']);
  });
  it('provides single value', () => {
    builder.provide(cxConstAsset(entry, 'value'));

    expect([...context.get(entry)]).toEqual(['value']);
  });
  it('removes the asset', () => {

    const value1 = 'value1';
    const value2 = 'value2';

    builder.provide(cxConstAsset(entry, value1));
    builder.provide(cxConstAsset(entry, value2)).off();

    expect([...context.get(entry)]).toEqual([value1]);
  });
  it('retains the constructed value when specifier removed', () => {

    const value1 = 'value1';
    const value2 = 'value2';

    builder.provide(cxConstAsset(entry, value1));

    const supply = builder.provide(cxConstAsset(entry, value2));

    expect([...context.get(entry)]).toEqual(['value1', 'value2']);

    supply.off();
    expect([...context.get(entry)]).toEqual(['value1', 'value2']);
  });
  it('provides fallback value if there is no value provided', () => {
    expect(context.get(entry, { or: ['fallback'] })).toEqual(['fallback']);
  });
  it('throws if there is no default value', () => {

    const entryWithoutDefaults = { perContext: cxArray({ byDefault: noop }) };

    expect(() => context.get(entryWithoutDefaults)).toThrow(new CxReferenceError(entryWithoutDefaults));
  });
  it('prefers fallback value over default one', () => {
    expect(
        context.get(
            { perContext: cxArray({ byDefault: () => ['default', 'value'] }) },
            { or: ['fallback', 'value'] },
        ),
    ).toEqual(['fallback', 'value']);
  });
  it('prefers `null` fallback value over default one', () => {
    expect(context.get(
        { perContext: cxArray({ byDefault: () => ['default', 'value'] }) },
        { or: null },
    )).toBeNull();
  });
  it('rebuilds the value in another context', () => {

    const value1 = 'value1';
    const value2 = 'value2';
    const mockProvider = jest.fn((_target: CxEntry.Target<readonly string[], string>) => value1);

    builder.provide(cxBuildAsset(entry, mockProvider));
    expect(context.get(entry)).toEqual([value1]);

    const builder2 = new CxBuilder(get => ({ get }), builder);
    const context2 = builder2.context;

    mockProvider.mockReturnValue(value2);
    expect(context.get(entry)).toEqual([value1]);
    expect(context2.get(entry)).toEqual([value2]);

    expect(mockProvider).toHaveBeenCalledTimes(2);
  });
});
