import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CxEntry, cxRecent } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';
import { CxBuilder } from '../builder';
import { CxPeerBuilder } from '../peer-builder';
import { cxBuildAsset } from './build.asset';
import { cxConstAsset } from './const.asset';

describe('cxBuildAsset', () => {
  let peer1: CxPeerBuilder;
  let builder1: CxBuilder;
  let peer2: CxPeerBuilder;
  let builder2: CxBuilder;

  beforeEach(() => {
    peer1 = new CxPeerBuilder();
    peer2 = new CxPeerBuilder();
  });

  let entry1: CxEntry<string>;
  let entry2: CxEntry<string>;

  beforeEach(() => {
    entry1 = { perContext: cxRecent(), toString: () => '[CxEntry 1]' };
    entry2 = { perContext: cxRecent(), toString: () => '[CxEntry 2]' };
  });

  it('evaluates asset once per context', () => {
    builder1 = new CxBuilder(get => ({ get }), peer1);
    builder2 = new CxBuilder(get => ({ get }), peer1);

    const build = jest.fn((target: CxEntry.Target<string>) => target.get(entry1) + '!');

    builder1.provide(cxConstAsset(entry1, '1'));
    builder2.provide(cxConstAsset(entry1, '2'));
    peer1.provide(cxBuildAsset(entry2, build));

    expect(builder1.get(entry1)).toBe('1');
    expect(builder2.get(entry1)).toBe('2');

    expect(builder1.get(entry2)).toBe('1!');
    expect(builder2.get(entry2)).toBe('2!');
    expect(builder2.get(entry2)).toBe('2!');
    expect(builder1.get(entry2)).toBe('1!');

    expect(build).toHaveBeenCalledTimes(2);
  });
  it('evaluates asset once in bound context', () => {
    builder1 = new CxBuilder(get => ({ get }), peer1);
    builder2 = new CxBuilder(get => ({ get }), builder1.boundPeer, peer2);

    const build = jest.fn((target: CxEntry.Target<string>) => target.get(entry1) + '!');

    peer1.provide(cxConstAsset(entry1, '1'));
    peer1.provide(cxBuildAsset(entry2, build));
    peer2.provide(cxConstAsset(entry1, '2'));

    expect(builder2.get(entry1)).toBe('2');
    expect(builder1.get(entry1)).toBe('1');

    expect(builder1.get(entry2)).toBe('1!');
    expect(builder2.get(entry2)).toBe('1!');
    expect(builder2.get(entry2)).toBe('1!');
    expect(builder1.get(entry2)).toBe('1!');

    expect(build).toHaveBeenCalledTimes(1);
  });
  it('clears cache once revoked', () => {
    builder1 = new CxBuilder(get => ({ get }), peer1);
    builder2 = new CxBuilder(get => ({ get }), peer1);

    const supply = new Supply();
    const build1 = jest.fn((target: CxEntry.Target<string>) => target.get(entry1) + '.1');
    const build2 = jest.fn((target: CxEntry.Target<string>) => target.get(entry1) + '.2');

    builder1.provide(cxConstAsset(entry1, '1'));
    builder2.provide(cxConstAsset(entry1, '2'));
    peer1.provide(cxBuildAsset(entry2, build1));
    builder2.provide(cxBuildAsset(entry2, build2, supply));

    expect(builder1.get(entry1)).toBe('1');
    expect(builder2.get(entry1)).toBe('2');

    expect(builder1.get(entry2)).toBe('1.1');
    expect(builder2.get(entry2)).toBe('2.2');
    expect(builder2.get(entry2)).toBe('2.2');
    expect(builder1.get(entry2)).toBe('1.1');

    expect(build1).toHaveBeenCalledTimes(1);
    expect(build2).toHaveBeenCalledTimes(1);

    supply.off();

    expect(builder1.get(entry2)).toBe('1.1');
    expect(builder2.get(entry2)).toBe('2.1');
    expect(builder2.get(entry2)).toBe('2.1');
    expect(builder1.get(entry2)).toBe('1.1');

    expect(build1).toHaveBeenCalledTimes(2);
    expect(build2).toHaveBeenCalledTimes(1);
  });
});
