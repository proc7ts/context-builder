import { CxAsset, CxEntry, CxValues } from '@proc7ts/context-values';
import { EventEmitter, OnEvent, onNever } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/supply';
import { CxBuilder } from '../builder';

export interface CxAsset$Placer<TValue, TAsset, TContext extends CxValues = CxValues> {
  readonly onUpdate: OnEvent<[]>;

  place(
    this: void,
    target: CxEntry.Target<TValue, TAsset, TContext>,
    cache: CxBuilder.Cache,
    collector: CxAsset.Collector<TAsset>,
  ): void;
}

export function CxAsset$placerOf<TValue, TAsset, TContext extends CxValues>(
  asset: CxAsset<TValue, TAsset, TContext>,
  supply: Supply,
): CxAsset$Placer<TValue, TAsset, TContext> | void {
  if (asset.placeAsset) {
    return {
      onUpdate: onNever,
      place(target, _cache, collector) {
        asset.placeAsset(target, collector);
      },
    };
  }
  if (asset.buildAsset) {
    const key = { asset };
    const updates = new EventEmitter<[]>();

    return {
      onUpdate: updates.on,

      place(target, cache, collector) {
        let provider = cache.get(key) as
          | ((collector: CxAsset.Collector<TAsset>) => void)
          | undefined;

        if (provider === undefined) {
          provider = asset.buildAsset(target, () => updates.send()) || CxAsset$noneProvider;
          cache.put(key, provider, supply);
        }

        provider(collector);
      },
    };
  }
}

function CxAsset$noneProvider(_collector: CxAsset.Collector<any>): void {
  // No assets.
}
