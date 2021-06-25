import { CxEntry } from '@proc7ts/context-values';
import { alwaysSupply, Supply } from '@proc7ts/supply';

/**
 * Context values supply.
 *
 * It is used to signal when context is no longer used (e.g. destroyed).
 *
 * A context value entry should destroy the provided value in such case.
 */
export type CxSupply = Supply;

/**
 * Context entry containing {@link CxSupply context values supply} as its value.
 *
 * It is guaranteed to present.
 *
 * Predefined to the {@link CxValues.supply supply of the context} if present. Defaults to supply-always otherwise.
 */
export const CxSupply: CxEntry<CxSupply> = {
  perContext(target) {

    const getSupply = target.lazy(cxSupply$value);

    return {
      assign(assigner) {

        const supply = getSupply();

        if (supply) {
          assigner(supply);
        }
      },
      assignDefault(assigner) {
        assigner(target.context.supply || alwaysSupply());
      },
    };
  },
};

function cxSupply$value(target: CxEntry.Target<Supply>): Supply | undefined {
  return target.recentAsset || target.context.supply;
}
