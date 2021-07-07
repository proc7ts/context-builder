import { CxAccessor, CxEntry, CxRequest, CxValues } from '@proc7ts/context-values';
import { lazyValue } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxBuilder$BoundPeer, CxBuilder$Cache } from './impl';
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
  private readonly _cache = new CxBuilder$Cache();

  /**
   * @internal
   */
  private readonly _bound: () => CxPeer = lazyValue(() => new CxBuilder$BoundPeer(this, this.cache));

  /**
   * Constructs context builder.
   *
   * @param createContext - Context creator function. Accepts context value accessor and the builder itself as
   * parameters, and returns created context.
   * @param peers - Context peers to apply assets from. These assets applied before the ones provided {@link provide
   * explicitly}. Peers listed later have lesser {@link CxAsset.Provided.rank rank values} than the ones listed earlier.
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

  protected override get cache(): CxBuilder.Cache {
    return this._cache;
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

export namespace CxBuilder {

  /**
   * Context cache the {@link CxPeer context peer} may use to store intermediate data.
   *
   * There is only one cache instance exists per context.
   */
  export interface Cache {

    /**
     * Obtains a value previously {@link put cached} under the given `key`.
     *
     * @param key - Cached value key.
     *
     * @returns Either cached value, or `undefined` if the value did not cached.
     */
    get(key: unknown): unknown | undefined;

    /**
     * Caches the `value` under the given `key`.
     *
     * @param key - Cached value key.
     * @param value - A value to cache.
     * @param supply - Value supply. The value will be removed from cache once this supply cut off.
     */
    put(key: unknown, value: unknown, supply: Supply): void;

  }

}
