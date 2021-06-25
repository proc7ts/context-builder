import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxEntry, cxSingle, CxValues } from '@proc7ts/context-values';
import { CxBuilder } from '../index';
import { cxConstAsset } from './const.asset';

describe('cxConstAsset', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder<CxValues>(get => ({ get }));
    context = builder.context;
  });

  const entry1: CxEntry<string> = { perContext: cxSingle() };
  const entry2: CxEntry<string> = { perContext: cxSingle() };

  it('accepts asset placeholder', () => {
    builder.provide(cxConstAsset(entry2, {
      placeAsset({ context }, collector) {
        collector(context.get(entry1) + '!!!');
      },
    }));
    builder.provide(cxConstAsset(entry1, 'test'));

    expect(context.get(entry2)).toBe('test!!!');
  });

});
