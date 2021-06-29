import { CxAsset, CxEntry, CxValues } from '@proc7ts/context-values';
import { EventReceiver } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/supply';

/**
 * Context peer providing assets preceding those from {@link CxBuilder.provide context builder}.
 *
 * @typeParam TContext - Context type the assets provided for.
 */
export interface CxPeer<TContext extends CxValues = CxValues> {

  /**
   * The number of {@link CxAsset.Provided.rank asset ranks} this peer contains.
   */
  readonly rankCount: number;

  /**
   * Iterates over particular entry assets in the same order they are provided.
   *
   * Each asset reported to the given `callback` function until the latter returns `false` or there are no more
   * assets.
   *
   * @param target - Context entry definition target to iterate over assets of.
   * @param callback - Assets callback.
   */
  eachAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      callback: CxAsset.Callback<TAsset>,
  ): void;

  /**
   * Iterates over particular entry assets with the most recent assets iterated first. I.e. in reverse order to the
   * order they are provided.
   *
   * Each asset reported to the given `callback` function until the latter returns `false` or there are no more
   * assets.
   *
   * @param target - Context entry definition target to iterate over assets of.
   * @param callback - Assets callback.
   */
  eachRecentAsset<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      callback: CxAsset.Callback<TAsset>,
  ): void;

  /**
   * Reads assets of particular entry value and start tracking of their additions.
   *
   * @param target - Context entry definition target to track assets for.
   * @param receiver - A receiver to report existing and added assets to.
   *
   * @returns Assets supply. Stops assets tracking once cut off.
   */
  trackAssets<TValue, TAsset>(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      receiver: EventReceiver<[CxAsset.Provided<TAsset>]>,
  ): Supply;

}
