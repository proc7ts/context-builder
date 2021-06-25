import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxEntry, CxReferenceError, cxSingle, CxValues } from '@proc7ts/context-values';
import { CxBuilder } from '../builder';
import { cxAliasAsset } from './alias.asset';
import { cxBuildAsset } from './build.asset';
import { cxConstAsset } from './const.asset';

describe('cxAliasAsset', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder<CxValues>(get => ({ get }));
    context = builder.context;
  });

  let origin: CxEntry<string>;
  let alias: CxEntry<string>;

  beforeEach(() => {
    origin = { perContext: cxSingle() };
    alias = { perContext: cxSingle() };
    builder.provide(cxAliasAsset(alias, origin));
  });

  it('aliases entry value', () => {
    builder.provide(cxConstAsset(origin, 'aliased'));
    expect(context.get(alias)).toBe('aliased');
  });
  it('throws when nothing to alias', () => {
    expect(() => context.get(alias)).toThrow(new CxReferenceError(alias));

    let error!: CxReferenceError;

    try {
      context.get(alias);
    } catch (e) {
      error = e as CxReferenceError;
    }

    expect(error.entry).toBe(alias);
    expect(error.message).toBe(new CxReferenceError(alias).message);

    const reason = error.reason as CxReferenceError;

    expect(reason.entry).toBe(origin);
    expect(reason.message).toBe(new CxReferenceError(origin).message);
    expect(reason.reason).toBeUndefined();
  });
  it('aliases default entry value', () => {
    origin = { perContext: cxSingle({ byDefault: () => 'default' }) };
    builder.provide(cxAliasAsset(alias, origin));
    expect(context.get(alias)).toBe('default');
  });
  it('throws if aliased entry does', () => {

    const error = new Error('Test');

    builder.provide(cxBuildAsset(origin, () => { throw error; }));
    expect(() => context.get(alias)).toThrow(error);
  });

});
