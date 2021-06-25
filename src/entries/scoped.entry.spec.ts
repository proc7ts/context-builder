import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxEntry, cxScoped, cxSingle, CxValues } from '@proc7ts/context-values';
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

  beforeEach(() => {
    entry = { perContext: cxScoped(scope, cxSingle()) };
  });

  it('accesses value in the same scope', () => {
    builder.provide(cxConstAsset(entry, 'test'));
    expect(context.get(entry)).toBe('test');
  });
  it('accesses value in another scope', () => {

    const builder2 = new CxBuilder(get => ({ get }), builder);
    const context2 = builder2.context;

    builder.provide(cxConstAsset(entry, 'right'));
    builder2.provide(cxConstAsset(entry, 'wrong'));

    expect(context2.get(entry)).toBe('right');
  });
});
