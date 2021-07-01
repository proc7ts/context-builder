import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxEntry, cxEvaluated, CxGetter, cxSingle, CxValues } from '@proc7ts/context-values';
import { cxBuildAsset } from './assets';
import { CxBuilder } from './builder';
import { CxPeerBuilder } from './peer-builder';

describe('CxPeer', () => {

  class TestContext1 implements CxValues {

    readonly test1: { readonly id: number };

    constructor(id: number, readonly get: CxGetter) {
      this.test1 = { id };
    }

  }

  class TestContext2 implements CxValues {

    constructor(readonly get: CxGetter) {
    }

    get test2(): { readonly id: 2 } {
      return { id: 2 };
    }

  }

  const entry: CxEntry<string> = { perContext: cxSingle() };

  let peer1: CxPeerBuilder<TestContext1>;
  let builder1: CxBuilder<TestContext1>;
  let context1: TestContext1;

  beforeEach(() => {
    peer1 = new CxPeerBuilder();
    builder1 = new CxBuilder(get => new TestContext1(1, get), peer1);
    context1 = builder1.context;
  });

  describe('context-bound peer', () => {

    let builder2: CxBuilder<TestContext2>;
    let context2: TestContext2;

    beforeEach(() => {
      builder2 = new CxBuilder<TestContext2>(get => new TestContext2(get), builder1.boundPeer);
      context2 = builder2.context;
    });

    it('provides access to bound assets', () => {
      builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
      expect(context2.get(entry)).toBe('#1.1');
      expect(context1.get(entry)).toBe('#1.1');
    });
    it('overridden by explicit asset', () => {
      builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
      builder2.provide(cxBuildAsset(entry, target => `#2.${target.context.test2.id}`));
      expect(context2.get(entry)).toBe('#2.2');
      expect(context1.get(entry)).toBe('#1.1');
    });

    describe('supply', () => {
      it('is the same as builder supply', () => {
        expect(builder1.boundPeer.supply).toBe(builder1.supply);
      });
    });

    describe('eachAsset', () => {
      it('iterates over assets', () => {

        const entry: CxEntry<string> = {
          perContext: cxEvaluated(target => {

            let value = '';

            target.eachAsset(asset => {
              value += asset;
            });

            return value;
          }),
        };

        builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
        builder2.provide(cxBuildAsset(entry, target => `#2.${target.context.test2.id}`));

        expect(context2.get(entry)).toBe('#1.1#2.2');
        expect(context1.get(entry)).toBe('#1.1');
      });
    });

    describe('eachRecentAsset', () => {
      it('iterates over assets in most-recent-first order', () => {

        const entry: CxEntry<string> = {
          perContext: cxEvaluated(target => {

            let value = '';

            target.eachRecentAsset(asset => {
              value += asset;
            });

            return value;
          }),
        };

        builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
        builder2.provide(cxBuildAsset(entry, target => `#2.${target.context.test2.id}`));

        expect(context2.get(entry)).toBe('#2.2#1.1');
        expect(context1.get(entry)).toBe('#1.1');
      });
    });

    describe('trackAssetList', () => {
      it('tracks assets', () => {

        const entry: CxEntry<string> = {
          perContext: target => {

            let value!: string;

            target.trackAssetList(assets => {

              let newValue = '';

              for (const provided of assets) {
                provided.eachAsset(asset => {
                  newValue += `${asset}@${provided.rank}`;
                });
              }

              value = newValue;
            });

            return {
              assign(assigner) {
                assigner(value);
              },
            };
          },
        };

        expect(context2.get(entry)).toBe('');
        expect(context1.get(entry)).toBe('');

        builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
        peer1.provide(cxBuildAsset(entry, target => `#1-peer.${target.context.test1.id}`));
        expect(context2.get(entry)).toBe('#1-peer.1@2#1.1@1');
        expect(context1.get(entry)).toBe('#1-peer.1@1#1.1@0');

        builder2.provide(cxBuildAsset(entry, target => `#2.${target.context.test2.id}`));
        expect(context2.get(entry)).toBe('#1-peer.1@2#1.1@1#2.2@0');
        expect(context1.get(entry)).toBe('#1-peer.1@1#1.1@0');
      });
    });
  });

  describe('derived peer', () => {

    let builder2: CxBuilder<TestContext1>;
    let context2: TestContext1;

    beforeEach(() => {
      builder2 = new CxBuilder<TestContext1>(get => new TestContext1(2, get), builder1);
      context2 = builder2.context;
    });

    it('provides access to bound assets', () => {
      builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
      expect(context2.get(entry)).toBe('#1.2');
      expect(context1.get(entry)).toBe('#1.1');
    });
    it('overridden by explicit asset', () => {
      builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
      builder2.provide(cxBuildAsset(entry, target => `#2.${target.context.test1.id}`));
      expect(context2.get(entry)).toBe('#2.2');
      expect(context1.get(entry)).toBe('#1.1');
    });

    describe('eachAsset', () => {
      it('iterates over assets', () => {

        const entry: CxEntry<string> = {
          perContext: cxEvaluated(target => {

            let value = '';

            target.eachAsset(asset => {
              value += asset;
            });

            return value;
          }),
        };

        builder1.provide(cxBuildAsset(entry, target => `#${target.context.test1.id}`));
        builder2.provide(cxBuildAsset(entry, target => `#${target.context.test1.id}`));

        expect(context2.get(entry)).toBe('#2#2');
        expect(context1.get(entry)).toBe('#1');
      });
    });

    describe('eachRecentAsset', () => {
      it('iterates over assets', () => {

        const entry: CxEntry<string> = {
          perContext: cxEvaluated(target => {

            let value = '';

            target.eachRecentAsset(asset => {
              value += asset;
            });

            return value;
          }),
        };

        builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
        builder2.provide(cxBuildAsset(entry, target => `#2.${target.context.test1.id}`));

        expect(context2.get(entry)).toBe('#2.2#1.2');
        expect(context1.get(entry)).toBe('#1.1');
      });
    });

    describe('trackAssetList', () => {
      it('iterates over assets in most-recent-first order', () => {

        const entry: CxEntry<string> = {
          perContext: target => {

            let value!: string;

            target.trackAssetList(assets => {

              let newValue = '';

              for (const provided of assets) {
                provided.eachAsset(asset => {
                  newValue += `${asset}@${provided.rank}`;
                });
              }

              value = newValue;
            });

            return {
              assign(assigner) {
                assigner(value);
              },
            };
          },
        };

        expect(context2.get(entry)).toBe('');
        expect(context1.get(entry)).toBe('');

        builder1.provide(cxBuildAsset(entry, target => `#1.${target.context.test1.id}`));
        peer1.provide(cxBuildAsset(entry, target => `#1-peer.${target.context.test1.id}`));
        expect(context2.get(entry)).toBe('#1-peer.2@2#1.2@1');
        expect(context1.get(entry)).toBe('#1-peer.1@1#1.1@0');

        builder2.provide(cxBuildAsset(entry, target => `#2.${target.context.test1.id}`));
        expect(context2.get(entry)).toBe('#1-peer.2@2#1.2@1#2.2@0');
        expect(context1.get(entry)).toBe('#1-peer.1@1#1.1@0');
      });
    });
  });
});
