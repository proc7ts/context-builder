import { CxAsset, CxEntry, CxValues } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';

/**
 * Creates constant context entry asset.
 *
 * @typeParam TAsset - Context value asset type.
 * @param entry - Target context entry.
 * @param value - Constant value asset, or `null`/`undefined` to not provide any assets.
 * @param supply - Asset supply. Removes the created asset once cut off.
 *
 * @returns New context entry asset.
 */
export function cxConstAsset<TAsset>(
    entry: CxEntry<unknown, TAsset>,
    value: TAsset | null | undefined,
    supply?: Supply,
): CxAsset<unknown, TAsset> {
  return {
    entry,
    placeAsset: value != null
        ? (_target, collector) => collector(value)
        : CxAsset$provideNone,
    supply,
  };
}

function CxAsset$provideNone<TValue, TAsset, TContext extends CxValues>(
    _target: CxEntry.Target<TValue, TAsset, TContext>,
    _collector: CxAsset.Collector<TAsset>,
): void {
  // No assets.
}
