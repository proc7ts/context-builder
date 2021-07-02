import { CxAsset, CxEntry, CxValues } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';

/**
 * Creates context entry asset that builds asset value with the given builder function.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Supported context type.
 * @param entry - Target context entry.
 * @param build - Asset builder function accepting entry definition target as its only parameter.
 * @param supply - Asset supply. Removes the created asset once cut off.
 *
 * @returns New context entry asset.
 */
export function cxBuildAsset<TValue, TAsset = TValue, TContext extends CxValues = CxValues>(
    entry: CxEntry<TValue, TAsset>,
    build: (
        this: void,
        target: CxEntry.Target<TValue, TAsset, TContext>,
    ) => TAsset | null | undefined,
    supply?: Supply,
): CxAsset<TValue, TAsset, TContext> {
  return {
    entry,
    placeAsset(target, collector) {

      const asset = build(target);

      if (asset != null) {
        collector(asset);
      }
    },
    supply,
  };
}
