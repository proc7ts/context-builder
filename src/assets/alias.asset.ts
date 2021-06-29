import { CxAsset, CxEntry, CxReferenceError } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';

/**
 * Creates aliasing context entry asset.
 *
 * @typeParam TAsset - Context value asset type.
 * @param entry - Target context entry.
 * @param alias - Context entry which value is used as an asset of the `target` entry.
 * @param supply - Asset supply. Removes the created asset once cut off.
 *
 * @returns New context entry asset.
 */
export function cxAliasAsset<TAsset>(
    entry: CxEntry<unknown, TAsset>,
    alias: CxEntry<TAsset, unknown>,
    supply?: Supply,
): CxAsset<unknown, TAsset> {
  return {
    entry,
    placeAsset(target, collector) {
      try {
        target.get(
            alias,
            {
              set(asset: TAsset) {
                collector(asset);
              },
            },
        );
      } catch (reason) {
        if (reason instanceof CxReferenceError) {
          throw new CxReferenceError(target.entry, undefined, reason);
        }
        throw reason;
      }
    },
    supply,
  };
}
