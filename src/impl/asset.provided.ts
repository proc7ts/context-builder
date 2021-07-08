import { CxAsset, CxEntry, CxTracking, CxValues } from '@proc7ts/context-values';
import { lazyValue } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxBuilder } from '../builder';
import { CxAsset$Placer } from './asset.placer';

export class CxAsset$Provided<TValue, TAsset, TContext extends CxValues> implements CxAsset.Provided<TAsset> {

  readonly _recentAsset: () => CxAsset.Evaluated<TAsset> | undefined;

  constructor(
      private readonly _target: CxEntry.Target<TValue, TAsset, TContext>,
      private readonly _cache: CxBuilder.Cache,
      private readonly _placer: CxAsset$Placer<TValue, TAsset, TContext>,
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
    this._placer.place(this._target, this._cache, callback);
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

  onUpdate(receiver: (this: void) => void, { supply = new Supply() }: CxTracking = {}): Supply {
    return this._placer.onUpdate({
      receive: _ctx => receiver(),
      supply: supply.needs(this.supply),
    });
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

  onUpdate(receiver: (this: void) => void, tracking?: CxTracking): Supply {
    return this.$.onUpdate(receiver, tracking);
  }

}
