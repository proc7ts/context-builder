import { CxAsset, CxEntry } from '@proc7ts/context-values';
import { lazyValue } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';

export class CxAsset$Provided<TAsset> implements CxAsset.Provided<TAsset> {

  readonly _recentAsset: () => CxAsset.Evaluated<TAsset> | undefined;

  constructor(
      private readonly _target: CxEntry.Target<unknown, TAsset>,
      private readonly _asset: CxAsset<unknown, TAsset>,
      readonly supply: Supply,
  ) {
    this._recentAsset = lazyValue(() => {

      let recent: CxAsset.Evaluated<TAsset> | undefined;

      this.eachRecentAsset(asset => {
        recent = {
          asset,
          rank: this.rank,
          supply: this.supply,
        };
        return false;
      });

      return recent;
    });
  }

  get rank(): 0 {
    return 0;
  }

  get recentAsset(): CxAsset.Evaluated<TAsset> | undefined {
    return this._recentAsset();
  }

  eachAsset(callback: CxAsset.Callback<TAsset>): void {
    this._asset.placeAsset(this._target, CxAsset$collector(this._target, callback));
  }

  eachRecentAsset(callback: CxAsset.Callback<TAsset>): void {

    const assets: TAsset[] = [];

    this.eachAsset(asset => {
      assets.push(asset);
    });

    for (let i = assets.length - 1; i >= 0; --i) {
      if (callback(assets[i]) === false) {
        break;
      }
    }
  }

}

export class CxAsset$Derived<TAsset> implements CxAsset.Provided<TAsset> {

  readonly rank: number;

  constructor(private readonly $: CxAsset.Provided<any>) {
    this.rank = $.rank + 1;
  }

  get supply(): Supply {
    return this.$.supply;
  }

  get recentAsset(): CxAsset.Evaluated<TAsset> | undefined {
    return this.$.recentAsset;
  }

  eachAsset(callback: CxAsset.Callback<TAsset>): void {
    return this.$.eachAsset(callback);
  }

  eachRecentAsset(callback: CxAsset.Callback<TAsset>): void {
    return this.$.eachRecentAsset(callback);
  }

}

export function CxAsset$collector<TAsset>(
    target: CxEntry.Target<unknown, TAsset>,
    callback: CxAsset.Callback<TAsset>,
): CxAsset.Collector<TAsset> {
  return asset => CxAsset$isPlaceholder(asset)
      ? asset.placeAsset(target, callback)
      : callback(asset);
}

function CxAsset$isPlaceholder<TAsset>(
    asset: TAsset | CxAsset.Placeholder<TAsset>,
): asset is CxAsset.Placeholder<TAsset> {
  return (typeof asset === 'object' && !!asset || typeof asset === 'function')
      && typeof (asset as Partial<CxAsset.Placeholder<TAsset>>).placeAsset === 'function';
}
