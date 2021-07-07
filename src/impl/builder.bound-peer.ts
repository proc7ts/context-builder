import { CxAsset, CxEntry, CxTracking, CxValues } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';
import { CxBuilder } from '../builder';
import { CxPeer } from '../peer';

export class CxBuilder$BoundPeer<TContext extends CxValues> implements CxPeer {

  constructor(private readonly _cb: CxBuilder<TContext>, private readonly _cache: CxBuilder.Cache) {
  }

  get supply(): Supply {
    return this._cb.supply;
  }

  get rankCount(): number {
    return this._cb.rankCount;
  }

  eachAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      _cache: CxBuilder.Cache,
      callback: CxAsset.Callback<TAsset>,
  ): void {

    const record = this._cb._record(target.entry);

    record.eachAsset(record.target, this._cache, callback);
  }

  eachRecentAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      _cache: CxBuilder.Cache,
      callback: CxAsset.Callback<TAsset>,
  ): void {

    const record = this._cb._record(target.entry);

    record.eachRecentAsset(record.target, this._cache, callback);
  }

  trackAssets<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      _cache: CxBuilder.Cache,
      receiver: CxAsset.Receiver<TAsset>,
      tracking?: CxTracking,
  ): Supply {

    const record = this._cb._record(target.entry);

    return record.trackAssets(record.target, this._cache, receiver, tracking);
  }

}
