import { beforeEach, describe, expect, it } from '@jest/globals';
import { CxAsset, CxEntry, CxReferenceError, CxRequestMethod, CxValues } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';
import { cxConstAsset } from './assets';
import { CxBuilder } from './builder';

describe('CxEntry', () => {

  let builder: CxBuilder;
  let context: CxValues;

  beforeEach(() => {
    builder = new CxBuilder(get => ({ get }));
    context = builder.context;
  });

  let builder2: CxBuilder;
  let context2: CxValues;

  beforeEach(() => {
    builder2 = new CxBuilder(get => ({ get }), builder);
    context2 = builder2.context;
  });

  describe('Definition', () => {
    describe('assign', () => {
      it('is ignored when absent', () => {

        const entry: CxEntry<string> = {
          perContext() {
            return {
              assignDefault(assigner) {
                assigner('default');
              },
            };
          },
        };

        expect(context.get(entry)).toBe('default');
        expect(context.get(entry, { or: null })).toBeNull();

        builder.provide(cxConstAsset(entry, 'other'));
        expect(context.get(entry)).toBe('default');
        expect(context.get(entry, { or: null })).toBeNull();
      });
      it('is requested for default value when `assignDefault()` not defined', () => {

        const entry: CxEntry<string> = {
          perContext() {
            return {
              assign(assigner) {
                assigner('provided');
              },
            };
          },
          toString: () => '[CxEntry test]',
        };

        expect(context.get(entry))
            .toBe('provided');
        expect(context.get(entry, { or: null }))
            .toBe('provided');
        expect(context.get(entry, { by: CxRequestMethod.Assets }))
            .toBe('provided');
        expect(context.get(entry, { or: null, by: CxRequestMethod.Assets }))
            .toBe('provided');
        expect(() => context.get(entry, { by: CxRequestMethod.Defaults }))
            .toThrow(new CxReferenceError(entry, 'The [CxEntry test] has no default value'));
        expect(context.get(entry, { or: null, by: CxRequestMethod.Defaults }))
            .toBeNull();
      });
      it('may provide default value', () => {

        const entry: CxEntry<string> = {
          perContext() {
            return {
              assign(assigner) {
                assigner('default', CxRequestMethod.Defaults);
              },
            };
          },
          toString: () => '[CxEntry test]',
        };

        expect(context.get(entry))
            .toBe('default');
        expect(context.get(entry, { or: null }))
            .toBeNull();
        expect(() => context.get(entry, { by: CxRequestMethod.Assets }))
            .toThrow(new CxReferenceError(entry, 'No value provided for [CxEntry test]'));
        expect(context.get(entry, { or: null, by: CxRequestMethod.Assets }))
            .toBeNull();
        expect(context.get(entry, { by: CxRequestMethod.Defaults }))
            .toBe('default');
        expect(context.get(entry, { or: null, by: CxRequestMethod.Defaults }))
            .toBe('default');
      });
    });

    describe('assignDefault', () => {
      it('may explicitly provide value', () => {

        const entry: CxEntry<string> = {
          perContext() {
            return {
              assignDefault(assigner) {
                assigner('provided', CxRequestMethod.Assets);
              },
            };
          },
          toString: () => '[CxEntry test]',
        };

        expect(context.get(entry))
            .toBe('provided');
        expect(context.get(entry, { or: null }))
            .toBeNull();
        expect(context.get(entry, { by: CxRequestMethod.Assets }))
            .toBe('provided');
        expect(context.get(entry, { or: null, by: CxRequestMethod.Assets }))
            .toBeNull();
        expect(() => context.get(entry, { by: CxRequestMethod.Defaults }))
            .toThrow(new CxReferenceError(entry, 'The [CxEntry test] has no default value'));
        expect(context.get(entry, { or: null, by: CxRequestMethod.Defaults }))
            .toBeNull();
      });
    });

    describe('when empty', () => {
      it('never provides values', () => {

        const entry: CxEntry<string> = {
          perContext() {
            return {};
          },
          toString: () => '[CxEntry test]',
        };

        expect(() => context.get(entry)).toThrow(new CxReferenceError(entry));
        expect(context.get(entry, { or: null })).toBeNull();
        expect(() => context.get(entry, { by: CxRequestMethod.Assets })).toThrow(new CxReferenceError(entry));
        expect(context.get(entry, { or: null, by: CxRequestMethod.Assets })).toBeNull();
        expect(() => context.get(entry, { by: CxRequestMethod.Defaults })).toThrow(new CxReferenceError(entry));
        expect(context.get(entry, { or: null, by: CxRequestMethod.Defaults })).toBeNull();
      });
    });
  });

  describe('Target', () => {
    describe('eachAsset', () => {

      const entry: CxEntry<string> = {
        perContext(target) {
          return {
            assign(assigner) {

              let result = '';

              target.eachAsset(asset => {
                result += asset;
                if (result.length > 2) {
                  target.supply.off();
                }
              });

              assigner(result);
            },
          };
        },
      };

      it('is aborted when supply cut off', () => {
        builder.provide(cxConstAsset(entry, 'a'));
        builder.provide(cxConstAsset(entry, 'b'));
        builder.provide(cxConstAsset(entry, 'c'));
        builder.provide(cxConstAsset(entry, 'd'));

        expect(context.get(entry)).toBe('abc');
        expect(context.get(entry)).toBe('');
      });
      it('is aborted in parent context when supply cut off', () => {
        builder.provide(cxConstAsset(entry, 'a'));
        builder.provide(cxConstAsset(entry, 'b'));
        builder.provide(cxConstAsset(entry, 'c'));
        builder.provide(cxConstAsset(entry, 'd'));
        builder2.provide(cxConstAsset(entry, 'e'));

        expect(context2.get(entry)).toBe('abc');
        expect(context2.get(entry)).toBe('');
      });
      it('is not aborted when parent context supply cut off', () => {
        builder.provide(cxConstAsset(entry, 'a'));
        builder2.provide(cxConstAsset(entry, 'e'));

        expect(context2.get(entry)).toBe('ae');

        builder.supply.off();
        expect(context2.get(entry)).toBe('e');
      });
    });

    describe('eachRecentAsset', () => {
      it('is aborted when supply cut off', () => {

        const entry: CxEntry<string> = {
          perContext(target) {
            return {
              assign(assigner) {

                let result = '';

                target.eachRecentAsset(asset => {
                  result += asset;
                  if (result.length > 2) {
                    target.supply.off();
                  }
                });

                assigner(result);
              },
            };
          },
        };

        builder.provide(cxConstAsset(entry, 'a'));
        builder.provide(cxConstAsset(entry, 'b'));
        builder.provide(cxConstAsset(entry, 'c'));
        builder.provide(cxConstAsset(entry, 'd'));

        expect(context.get(entry)).toBe('dcb');
        expect(context.get(entry)).toBe('');
      });
      it('is aborted when supply cut off by asset', () => {

        const entry: CxEntry<string, number> = {
          perContext(target) {
            return {
              assign(assigner) {

                let result = '';

                target.eachRecentAsset(asset => {
                  result += asset;
                });

                assigner(result);
              },
            };
          },
        };
        const asset: CxAsset<unknown, number> = {
          entry,
          supply: new Supply(),
          placeAsset(target, collector) {
            for (let i = 0; i < 10; ++i) {
              if (i > 2) {
                target.supply.off();
              }
              if (collector(i) === false) {
                break;
              }
            }
          },
        };

        builder.provide(asset);

        expect(context.get(entry)).toBe('012');
        expect(context.get(entry)).toBe('');
      });
    });

    describe('trackAssets', () => {
      it('is aborted when tracking supply cut off', () => {

        const entry: CxEntry<string> = {
          perContext(target) {

            const list: CxAsset.Provided<string>[] = [];
            let value = '';

            const trackingSupply = target.trackAssets(provided => {
              list.push(provided);
              value = '';
              for (const provided of list) {
                provided.eachAsset(asset => {
                  value += asset;
                  if (asset === '!') {
                    trackingSupply.off();
                    target.provide(cxConstAsset(entry, '*'));
                  }
                });
              }
            });

            return {
              assign(assigner) {
                assigner(value);
              },
            };
          },
        };

        builder.provide(cxConstAsset(entry, 'a'));
        builder.provide(cxConstAsset(entry, 'b'));
        builder.provide(cxConstAsset(entry, 'c'));

        expect(context.get(entry)).toBe('abc');

        builder.provide(cxConstAsset(entry, '!'));
        builder.provide(cxConstAsset(entry, 'd'));

        expect(context.get(entry)).toBe('abc!');
      });
    });
  });
});
