import { CxAsset, CxEntry, CxValues } from '@proc7ts/context-values';
import { afterSupplied, EventSupplier } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';

/**
 * Creates context entry asset that updates value assets on each received event.
 *
 * Evaluates event supplier at most once per context. Then treats the received event as array of value assets.
 *
 * @typeParam TValue - Context value type.
 * @typeParam TAsset - Context value asset type.
 * @typeParam TContext - Supported context type.
 * @param entry - Target context entry.
 * @param build - Asset supplier builder function accepting entry definition target as its only parameter.
 * @param supply - Asset supply. Removes the created asset once cut off.
 *
 * @returns New context entry asset.
 */
export function cxOnAsset<TValue, TAsset = TValue, TContext extends CxValues = CxValues>(
    entry: CxEntry<TValue, TAsset>,
    build: (
        this: void,
        target: CxEntry.Target<TValue, TAsset, TContext>,
    ) => EventSupplier<TAsset[]> | false | null | undefined,
    supply = new Supply(),
): CxAsset<TValue, TAsset, TContext> {
  return {
    entry,
    buildAsset(target, update) {

      let assets: TAsset[];
      let sendUpdate: () => void = noop;
      const supplier = build(target);

      if (!supplier) {
        return;
      }

      afterSupplied(supplier, () => [])({
        receive(_ctx, ...event) {
          assets = event;
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
