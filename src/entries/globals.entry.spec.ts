import { describe, expect, it } from '@jest/globals';
import { CxGlobals, CxReferenceError } from '@proc7ts/context-values';
import { cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';

describe('CxGlobals', () => {
  it('has no default value', () => {
    const cxBuilder = new CxBuilder(get => ({ get }));

    expect(() => cxBuilder.get(CxGlobals)).toThrow(new CxReferenceError(CxGlobals));
  });
  it('can be provided', () => {
    const cxBuilder = new CxBuilder(get => ({ get }));

    cxBuilder.provide(cxConstAsset(CxGlobals, cxBuilder.context));

    expect(cxBuilder.get(CxGlobals)).toBe(cxBuilder.context);
  });
});
