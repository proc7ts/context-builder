import { describe, expect, it } from '@jest/globals';
import { isAlwaysSupply, Supply } from '@proc7ts/supply';
import { cxConstAsset } from '../assets';
import { CxBuilder } from '../builder';
import { CxSupply } from './supply';

describe('CxSupply', () => {
  it('is always-supply by default', () => {

    const context = new CxBuilder(get => ({ get })).context;

    expect(context.get(CxSupply, { or: null })).toBeNull();
    expect(isAlwaysSupply(context.get(CxSupply))).toBe(true);
  });
  it('is equal to the supply of context', () => {

    const supply = new Supply();
    const context = new CxBuilder(get => ({ supply, get })).context;

    expect(context.get(CxSupply, { or: null })).toBe(supply);
    expect(context.get(CxSupply, { or: undefined })).toBe(supply);
    expect(context.get(CxSupply)).toBe(supply);
  });
  it('is equal to the supply of context when fallback specified', () => {

    const supply = new Supply();
    const context = new CxBuilder(get => ({ supply, get })).context;
    const fallback = new Supply();

    expect(context.get(CxSupply, { or: fallback })).toBe(supply);
  });
  it('is equal to fallback when context has no supply and no value provided', () => {

    const context = new CxBuilder(get => ({ get })).context;
    const fallback = new Supply();

    expect(context.get(CxSupply, { or: fallback })).toBe(fallback);
  });
  it('is equal to provided value when context is a peer', () => {

    const supply = new Supply();
    const builder = new CxBuilder(get => ({ supply, get }));
    const context = builder.context;
    const provided = new Supply();

    builder.provide(cxConstAsset(CxSupply, provided));

    expect(context.get(CxSupply)).toBe(provided);
    expect(context.get(CxSupply, { or: new Supply() })).toBe(provided);
    expect(context.get(CxSupply, { or: null })).toBe(provided);
    expect(context.get(CxSupply, { or: undefined })).toBe(provided);
  });
});
