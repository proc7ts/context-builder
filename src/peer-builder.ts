import { CxAsset, CxEntry, CxModifier, CxTracking, CxValues } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';
import { CxBuilder } from './builder';
import { CxBuilder$NoCache, CxEntry$Record } from './impl';
import { CxPeer } from './peer';

/**
 * Context peer builder.
 *
 * Allows to specify value assets preceding those from {@link CxBuilder.provide context builder}.
 *
 * In contrast to {@link CxBuilder context builder} this one does not build any context. It is an error accessing it.
 *
 * @typeParam TContext - Context type the assets provided for.
 */
export class CxPeerBuilder<TContext extends CxValues = CxValues> implements CxModifier<TContext>, CxPeer<TContext> {

  /**
   * @internal
   */
  private readonly _records = new Map<CxEntry<any, any>, CxEntry$Record<any, any, TContext>>();

  /**
   * @internal
   */
  readonly _peers: readonly CxPeer<TContext>[];

  /**
   * @internal
   */
  private readonly _supply = new Supply();

  /**
   * @internal
   */
  private _rankCount = 0;

  /**
   * Constructs context peer builder.
   *
   * @param peers - Context peers to apply assets from. These assets applied before the ones provided
   * @param peers - Context peers to apply assets from. These assets applied before the ones provided {@link provide
   * explicitly}. Peers listed later have lesser {@link CxAsset.Provided.rank rank values} than the ones listed earlier.
   */
  constructor(...peers: CxPeer<TContext>[]) {
    this._peers = peers;
  }

  get context(): TContext {
    throw new TypeError('Peer context is not available');
  }

  get rankCount(): number {
    return this._rankCount ||= this._peers.reduce((rankCount, peer) => rankCount + peer.rankCount, 1);
  }

  get supply(): Supply {
    return this._supply;
  }

  protected get cache(): CxBuilder.Cache {
    return CxBuilder$NoCache;
  }

  provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset, TContext>): Supply {
    return this._record(asset.entry).provide(asset);
  }

  eachAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      cache: CxBuilder.Cache,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    this._record(target.entry).eachAsset(target, cache, callback);
  }

  eachRecentAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      cache: CxBuilder.Cache,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    this._record(target.entry).eachRecentAsset(target, cache, callback);
  }

  trackAssets<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      cache: CxBuilder.Cache,
      receiver: CxAsset.Receiver<TAsset>,
      tracking?: CxTracking,
  ): Supply {
    return this._record(target.entry).trackAssets(target, cache, receiver, tracking);
  }

  /**
   * @internal
   */
  _record<TValue, TAsset>(entry: CxEntry<TValue, TAsset>): CxEntry$Record<TValue, TAsset, TContext> {

    let record: CxEntry$Record<TValue, TAsset, TContext> | undefined = this._records.get(entry);

    if (!record) {
      this._records.set(entry, record = new CxEntry$Record(this, this.cache, entry));
    }

    return record;
  }

}
