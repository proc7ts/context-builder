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
    this._asset.placeAsset(this._target, callback);
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

  constructor(private readonly $: CxAsset.Provided<any>, readonly rank: number) {
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
