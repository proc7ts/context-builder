import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cxDefaultScoped, CxEntry, CxRequestMethod, cxScoped, cxSingle, CxValues } from '@proc7ts/context-values';
import { Mock } from 'jest-mock';
import { cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';

describe('cxScoped', () => {

  let builder: CxBuilder;
  let context: CxValues;
  let scope: CxEntry<CxValues>;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
    context = builder.context;
    scope = { perContext: cxSingle() };
    builder.provide(cxConstAsset(scope, context));
  });

  let entry: CxEntry<string>;
  let entry2: CxEntry<string>;

  beforeEach(() => {
    entry = { perContext: cxScoped(scope, cxSingle({ byDefault: () => 'default' })) };
    entry2 = { perContext: cxScoped(scope, cxSingle()) };
  });

  let set: Mock<void, [string, CxRequestMethod]>;

  beforeEach(() => {
    set = jest.fn();
  });

  it('obtains provided value in the same scope', () => {
    builder.provide(cxConstAsset(entry, 'test'));
    expect(context.get(entry)).toBe('test');
    expect(context.get(entry, { by: CxRequestMethod.Assets, set })).toBe('test');
    expect(set).toHaveBeenCalledWith('test', CxRequestMethod.Assets);
    set.mockReset();
    expect(context.get(entry2, { or: 'fallback' })).toBe('fallback');
    expect(context.get(entry2, { or: 'fallback', by: CxRequestMethod.Assets, set })).toBe('fallback');
    expect(set).toHaveBeenCalledWith('fallback', CxRequestMethod.Fallback);
  });
  it('obtains default value in the same scope', () => {
    expect(context.get(entry)).toBe('default');
    expect(context.get(entry, { by: CxRequestMethod.Assets, set })).toBe('default');
    expect(set).toHaveBeenCalledWith('default', CxRequestMethod.Defaults);
    set.mockReset();
    expect(context.get(entry, { by: CxRequestMethod.Defaults, set })).toBe('default');
    expect(set).toHaveBeenCalledWith('default', CxRequestMethod.Defaults);
    set.mockReset();
    expect(context.get(entry2, { or: 'fallback' })).toBe('fallback');
    expect(context.get(entry2, { or: 'fallback', by: CxRequestMethod.Assets, set })).toBe('fallback');
    expect(set).toHaveBeenCalledWith('fallback', CxRequestMethod.Fallback);
  });
  it('requests default value in the same scope', () => {
    builder.provide(cxConstAsset(entry, 'test'));
    expect(context.get(entry, { by: CxRequestMethod.Defaults, set })).toBe('default');
    expect(set).toHaveBeenCalledWith('default', CxRequestMethod.Defaults);
    set.mockReset();
    expect(context.get(entry2, { or: 'fallback', by: CxRequestMethod.Defaults, set })).toBe('fallback');
    expect(set).toHaveBeenCalledWith('fallback', CxRequestMethod.Fallback);
  });
  it('obtains value from another scope', () => {

    const builder2 = new CxBuilder(get => ({ get }), builder);
    const context2 = builder2.context;

    builder.provide(cxConstAsset(entry, 'right'));
    builder2.provide(cxConstAsset(entry, 'wrong'));

    expect(context2.get(entry)).toBe('right');
    expect(context2.get(entry, { by: CxRequestMethod.Assets, set })).toBe('right');
    expect(set).toHaveBeenCalledWith('right', CxRequestMethod.Assets);
    set.mockReset();
    expect(context2.get(entry2, { or: 'fallback' })).toBe('fallback');
    expect(context2.get(entry2, { or: 'fallback', by: CxRequestMethod.Assets, set })).toBe('fallback');
    expect(set).toHaveBeenCalledWith('fallback', CxRequestMethod.Fallback);
  });
  it('obtains default value from another scope', () => {

    const builder2 = new CxBuilder(get => ({ get }), builder);
    const context2 = builder2.context;

    expect(context2.get(entry, { by: CxRequestMethod.Assets })).toBe('default');
    expect(context2.get(entry, { by: CxRequestMethod.Defaults })).toBe('default');
    expect(context2.get(entry2, { or: 'fallback', by: CxRequestMethod.Defaults, set })).toBe('fallback');
    expect(set).toHaveBeenCalledWith('fallback', CxRequestMethod.Fallback);
  });
});

describe('cxDefaultScoped', () => {

  let builder: CxBuilder;
  let context: CxValues;
  let scope: CxEntry<CxValues>;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
    context = builder.context;
    scope = { perContext: cxSingle() };
    builder.provide(cxConstAsset(scope, context));
  });

  let entry: CxEntry<string>;
  let entry2: CxEntry<string>;

  beforeEach(() => {
    entry = { perContext: cxDefaultScoped(scope, cxSingle({ byDefault: () => 'default' })) };
    entry2 = { perContext: cxDefaultScoped(scope, cxSingle()) };
  });

  it('obtains value in the same scope', () => {
    builder.provide(cxConstAsset(entry, 'test'));
    expect(context.get(entry)).toBe('test');
    expect(context.get(entry, { by: CxRequestMethod.Assets })).toBe('test');
    expect(context.get(entry2, { or: 'fallback' })).toBe('fallback');
    expect(context.get(entry2, { or: 'fallback', by: CxRequestMethod.Assets })).toBe('fallback');
  });
  it('obtains default value in the same scope', () => {
    builder.provide(cxConstAsset(entry, 'test'));
    expect(context.get(entry, { by: CxRequestMethod.Defaults })).toBe('default');
    expect(context.get(entry2, { or: 'fallback', by: CxRequestMethod.Defaults })).toBe('fallback');
  });
  it('does not request the value from another scope', () => {

    const builder2 = new CxBuilder(get => ({ get }), builder);
    const context2 = builder2.context;

    builder.provide(cxConstAsset(entry, 'wrong'));
    builder2.provide(cxConstAsset(entry, 'right'));

    expect(context2.get(entry)).toBe('right');
    expect(context2.get(entry, { by: CxRequestMethod.Assets })).toBe('right');
    expect(context2.get(entry2, { or: 'fallback' })).toBe('fallback');
    expect(context2.get(entry2, { or: 'fallback', by: CxRequestMethod.Assets })).toBe('fallback');
  });
  it('obtains default value from another scope', () => {

    const builder2 = new CxBuilder(get => ({ get }), builder);
    const context2 = builder2.context;

    builder.provide(cxConstAsset(entry, 'right'));
    builder2.provide(cxConstAsset(entry, 'wrong'));

    expect(context2.get(entry, { by: CxRequestMethod.Defaults })).toBe('default');
    expect(context2.get(entry2, { or: 'fallback', by: CxRequestMethod.Defaults })).toBe('fallback');
  });
});
