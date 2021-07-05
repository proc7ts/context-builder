import { CxAsset, CxEntry, CxRequest, CxTracking, CxValues } from '@proc7ts/context-values';
import { deduplicateAfter_, mapAfter_ } from '@proc7ts/fun-events';
import { lazyValue } from '@proc7ts/primitives';
import { flatMapIt, itsElements, reverseArray } from '@proc7ts/push-iterator';
import { Supply } from '@proc7ts/supply';
import { CxEntry$assetsByRank, CxEntry$recentAsset } from './entry.assets-by-rank.impl';
import { CxEntry$Record } from './entry.record.impl';

export class CxEntry$Target<TValue, TAsset, TContext extends CxValues>
    implements CxEntry.Target<TValue, TAsset, TContext> {

  constructor(
      private readonly _record: CxEntry$Record<TValue, TAsset, TContext>,
      readonly supply: Supply,
  ) {
  }

  get entry(): CxEntry<TValue, TAsset> {
    return this._record.entry;
  }

  get context(): TContext {
    return this._record.builder.context;
  }

  get recentAsset(): TAsset | undefined {

    let mostRecent: TAsset | undefined;

    this.eachRecentAsset(asset => {
      mostRecent = asset;
      return false;
    });

    return mostRecent;
  }

  get<TValue, TAsset = TValue>(entry: CxEntry<TValue, TAsset>, request?: CxRequest<TValue>): TValue | null {
    return this.context.get(entry, request);
  }

  provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset, TContext>): Supply {
    return this._record.builder.provide(asset).needs(this);
  }

  eachAsset(callback: CxAsset.Callback<TAsset>): void {
    this._record.builder.eachAsset(this, callback);
  }

  eachRecentAsset(callback: CxAsset.Callback<TAsset>): void {
    this._record.builder.eachRecentAsset(this, callback);
  }

  trackAssets(receiver: CxAsset.Receiver<TAsset>, tracking?: CxTracking): Supply {
    return this._record.builder.trackAssets(this, receiver, tracking);
  }

  trackRecentAsset(receiver: CxAsset.RecentReceiver<TAsset>, { supply = new Supply() }: CxTracking = {}): Supply {
    return CxEntry$assetsByRank(this).read.do(
        mapAfter_(CxEntry$recentAsset),
        deduplicateAfter_(),
    )({
      supply,
      receive(_ctx, evaluated) {
        receiver(evaluated);
      },
    });
  }

  trackAssetList(receiver: CxAsset.ListReceiver<TAsset>, { supply = new Supply() }: CxTracking = {}): Supply {
    return CxEntry$assetsByRank(this).read.do(
        mapAfter_(assetByRank => itsElements(flatMapIt(
            reverseArray(assetByRank),
            rankAssets => rankAssets.values(),
        ))),
    )({
      supply,
      receive(_ctx, list) {
        receiver(list);
      },
    });
  }

  lazy<T>(evaluator: (this: void, target: this) => T): (this: void) => T {
    return lazyValue(() => evaluator(this));
  }

}
