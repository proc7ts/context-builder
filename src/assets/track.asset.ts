import { CxAsset, CxEntry, CxValues } from '@proc7ts/context-values';
import { afterEventBy, sendEventsTo } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';

/**
 * Creates context entry asset that tracks for value asset updates.
 *
 * Starts tracking at most once per context.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Supported context type.
 * @param entry - Target context entry.
 * @param track - Starts assets tracking. Accepts context entry definition target, assets receiver function, and assets
 * supply as parameters. Passes updated assets to receiver until supply cut off.
 * @param supply - Asset supply. Removes the created asset once cut off.
 *
 * @returns New context entry asset.
 */
export function cxTrackAsset<TValue, TAsset = TValue, TContext extends CxValues = CxValues>(
    entry: CxEntry<TValue, TAsset>,
    track: (
        this: void,
        target: CxEntry.Target<TValue, TAsset, TContext>,
        receiver: (this: void, ...assets: TAsset[]) => void,
        supply: Supply,
    ) => void,
    supply = new Supply(),
): CxAsset<TValue, TAsset, TContext> {
  return {
    entry,
    buildAsset(target, update) {

      let assets: TAsset[];
      let sendUpdate: () => void = noop;
      const readUpdates = afterEventBy<TAsset[]>(rcv => track(target, sendEventsTo(rcv), rcv.supply), () => []);

      readUpdates({
        receive(_ctx, ...updates) {
          assets = updates;
          sendUpdate();
        },
        supply: new Supply().needs(supply).needs(target),
      });

      sendUpdate = update; // Start actually sending updates only after receiver registration.

      return collector => {
        for (const asset of assets) {
          if (collector(asset) === false) {
            break;
          }
        }
      };
    },
    supply,
  };
}
