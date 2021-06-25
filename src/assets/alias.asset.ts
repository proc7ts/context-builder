import { CxAsset, CxEntry, CxReferenceError, CxValues } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';

/**
 * Creates aliasing context entry asset.
 *
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Context type.
 * @param entry - Target context entry.
 * @param alias - Context entry which value is used as an asset of the `target` entry.
 * @param supply - Asset supply. Removes the created asset once cut off.
 *
 * @returns New context entry asset.
 */
export function cxAliasAsset<TAsset, TContext extends CxValues = CxValues>(
    entry: CxEntry<unknown, TAsset>,
    alias: CxEntry<TAsset, unknown>,
    supply?: Supply,
): CxAsset<unknown, TAsset, TContext> {
  return {
    entry,
    placeAsset(target, collector) {

      let asset: TAsset;

      try {
        asset = target.get(alias);
      } catch (reason) {
        if (reason instanceof CxReferenceError) {
          throw new CxReferenceError(target.entry, undefined, reason);
        }
        throw reason;
      }

      collector(asset);
    },
    supply,
  };
}
