import { CxAsset, CxEntry, CxModifier, CxValues } from '@proc7ts/context-values';
import { EventReceiver } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/supply';
import { CxEntry$Record } from './impl';
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
   * {@link provide explicitly}.
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

  provide<TValue, TAsset = TValue>(asset: CxAsset<TValue, TAsset, TContext>): Supply {
    return this._record(asset.entry).provide(asset);
  }

  eachAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    this._record(target.entry).eachAsset(target, callback);
  }

  eachRecentAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    this._record(target.entry).eachRecentAsset(target, callback);
  }

  trackAssets<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      receiver: EventReceiver<[CxAsset.Provided<TAsset>]>,
  ): Supply {
    return this._record(target.entry).trackAssets(target, receiver);
  }

  /**
   * @internal
   */
  _record<TValue, TAsset>(entry: CxEntry<TValue, TAsset>): CxEntry$Record<TValue, TAsset, TContext> {

    let record: CxEntry$Record<TValue, TAsset, TContext> | undefined = this._records.get(entry);

    if (!record) {
      this._records.set(entry, record = new CxEntry$Record(this, entry));
    }

    return record;
  }

}
