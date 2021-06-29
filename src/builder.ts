import { CxAsset, CxEntry, CxRequest, CxValues } from '@proc7ts/context-values';
import { EventReceiver } from '@proc7ts/fun-events';
import { lazyValue } from '@proc7ts/primitives';
import { neverSupply, Supply } from '@proc7ts/supply';
import { CxEntry$Record } from './impl';
import { CxPeer } from './peer';

const CxPeer$noAssets: CxPeer = {

  eachAsset<TValue, TAsset>(
      _target: CxEntry.Target<TValue, TAsset>,
      _callback: CxAsset.Callback<TAsset>,
  ): void {
    // No assets to iterate.
  },

  eachRecentAsset<TValue, TAsset>(
      _target: CxEntry.Target<TValue, TAsset>,
      _callback: CxAsset.Callback<TAsset>,
  ): void {
    // No assets to iterate.
  },

  trackAssets<TValue, TAsset>(
      _target: CxEntry.Target<TValue, TAsset>,
      _receiver: EventReceiver<[CxAsset.Provided<TAsset>]>,
  ): Supply {
    return neverSupply();
  },

};

/**
 * Context builder.
 *
 * Provides value assets for the context.
 */
export class CxBuilder<TContext extends CxValues = CxValues>
    implements CxValues.Modifier<TContext>, CxValues.Accessor, CxPeer<TContext> {

  /**
   * @internal
   */
  private readonly _cx: () => TContext;

  /**
   * @internal
   */
  private readonly _records = new Map<CxEntry<any, any>, CxEntry$Record<any, any, TContext>>();

  /**
   * @internal
   */
  readonly _peer: CxPeer<TContext>;

  /**
   * @internal
   */
  private readonly _bound: () => CxPeer = lazyValue(() => new CxBuilder$BoundPeer(this));

  /**
   * Constructs context builder.
   *
   * @param createContext - Context creator function. Accepts context value {@link CxValues.Getter getter} and the
   * builder itself as parameters, and returns created context.
   * @param peer - Context peer to apply assets from. These assets applied before the ones provided
   * {@link provide explicitly}.
   */
  constructor(
      createContext: (this: void, getValue: CxValues.Getter, builder: CxBuilder<TContext>) => TContext,
      peer: CxPeer<TContext> = CxPeer$noAssets,
  ) {
    this._cx = lazyValue(() => createContext(
        (entry, request) => this.get(entry, request),
        this,
    ));
    this._peer = peer;
  }

  /**
   * Context to build.
   */
  get context(): TContext {
    return this._cx();
  }

  /**
   * A peer providing assets bound to {@link context}.
   *
   * Unlike the builder itself, this peer may provide assets for any context, as they constructed in compatible one.
   */
  get boundPeer(): CxPeer {
    return this._bound();
  }

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest.WithoutFallback<TValue>): TValue;

  get<TValue>(entry: CxEntry<TValue, any>, request: CxRequest.WithFallback<TValue>): TValue;

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest<TValue>): TValue | null;

  get<TValue>(entry: CxEntry<TValue, any>, request?: CxRequest<TValue>): TValue | null {
    return this._record(entry).get(request);
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

  _record<TValue, TAsset>(entry: CxEntry<TValue, TAsset>): CxEntry$Record<TValue, TAsset, TContext> {

    let record: CxEntry$Record<TValue, TAsset, TContext> | undefined = this._records.get(entry);

    if (!record) {
      this._records.set(entry, record = new CxEntry$Record(this, entry));
    }

    return record;
  }

}

class CxBuilder$BoundPeer<TContext extends CxValues> implements CxPeer {

  constructor(private readonly _cb: CxBuilder<TContext>) {
  }

  eachAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxAsset.Callback<TAsset>,
  ): void {

    const record = this._cb._record(target.entry);

    record.eachAsset(record.target, callback);
  }

  eachRecentAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxAsset.Callback<TAsset>,
  ): void {

    const record = this._cb._record(target.entry);

    record.eachRecentAsset(record.target, callback);
  }

  trackAssets<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: EventReceiver<[CxAsset.Provided<TAsset>]>,
  ): Supply {

    const record = this._cb._record(target.entry);

    return record.trackAssets(record.target, receiver);
  }

}
