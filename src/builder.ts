import { CxAccessor, CxAsset, CxEntry, CxRequest, CxTracking, CxValues } from '@proc7ts/context-values';
import { lazyValue } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxPeer } from './peer';
import { CxPeerBuilder } from './peer-builder';

/**
 * Context builder.
 *
 * Provides value assets for the context.
 *
 * @typeParam TContext - A type of context to build.
 */
export class CxBuilder<TContext extends CxValues = CxValues> extends CxPeerBuilder<TContext> implements CxValues {

  /**
   * @internal
   */
  private readonly _cx: () => TContext;

  /**
   * @internal
   */
  private readonly _bound: () => CxPeer = lazyValue(() => new CxBuilder$BoundPeer(this));

  /**
   * Constructs context builder.
   *
   * @param createContext - Context creator function. Accepts context value accessor and the builder itself as
   * parameters, and returns created context.
   * @param peers - Context peers to apply assets from. These assets applied before the ones provided
   * {@link provide explicitly}.
   */
  constructor(
      createContext: (this: void, getValue: CxAccessor, builder: CxBuilder<TContext>) => TContext,
      ...peers: CxPeer<TContext>[]
  ) {
    super(...peers);
    this._cx = lazyValue(() => createContext(
        (entry, request) => this.get(entry, request),
        this,
    ));
  }

  /**
   * Context to build.
   */
  override get context(): TContext {
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

}

class CxBuilder$BoundPeer<TContext extends CxValues> implements CxPeer {

  constructor(private readonly _cb: CxBuilder<TContext>) {
  }

  get supply(): Supply {
    return this._cb.supply;
  }

  get rankCount(): number {
    return this._cb.rankCount;
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
      receiver: CxAsset.Receiver<TAsset>,
      tracking?: CxTracking,
  ): Supply {

    const record = this._cb._record(target.entry);

    return record.trackAssets(record.target, receiver, tracking);
  }

}
