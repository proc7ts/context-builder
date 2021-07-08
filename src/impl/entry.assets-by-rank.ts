import { CxAsset, CxEntry } from '@proc7ts/context-values';
import { trackValue, ValueTracker } from '@proc7ts/fun-events';
import { itsElements } from '@proc7ts/push-iterator';
import { Supply } from '@proc7ts/supply';

export type CxEntry$AssetsByRank<TAsset> = Map<Supply, CxAsset.Provided<TAsset>>[];

export function CxEntry$assetsByRank<TAsset>(
    target: CxEntry.Target<unknown, TAsset>,
    trackingSupply: Supply,
): ValueTracker<CxEntry$AssetsByRank<TAsset>> {

  const assetsByRank = trackValue<CxEntry$AssetsByRank<TAsset>>([]);

  assetsByRank.supply.needs(trackingSupply).needs(target);

  const removeAsset = (supply: Supply, rank: number): void => {

    const ranks = [...assetsByRank.it];
    const rankAssets = ranks[rank]!;

    rankAssets.delete(supply);
    assetsByRank.it = ranks;
  };
  const updateAsset = (): unknown => assetsByRank.it = [...assetsByRank.it];
  const addAsset = (asset: CxAsset.Provided<TAsset>): void => {

    const { supply, rank } = asset;
    const ranks = [...assetsByRank.it];

    for (let i = ranks.length; i <= rank; ++i) {
      ranks[i] ||= new Map();
    }

    const rankAssets = ranks[rank];

    rankAssets.set(supply, asset);
    assetsByRank.it = ranks;

    supply.whenOff(() => removeAsset(supply, rank));
    asset.onUpdate(updateAsset);
  };

  target.trackAssets(addAsset, assetsByRank);

  return assetsByRank;
}

export function CxEntry$recentAsset<TAsset>(
    assetsByRank: CxEntry$AssetsByRank<TAsset>,
): CxAsset.Evaluated<TAsset> | undefined {
  for (const rankAssets of assetsByRank) {

    const list: CxAsset.Provided<TAsset>[] = itsElements(rankAssets.values());

    for (let i = list.length - 1; i >= 0; --i) {

      const recent = list[i].recentAsset;

      if (recent) {
        return recent;
      }
    }
  }

  return;
}
