import {
  CxAsset,
  CxEntry,
  CxReferenceError,
  CxRequest,
  CxRequestMethod,
  CxTracking,
  CxValues,
} from '@proc7ts/context-values';
import { EventEmitter, EventReceiver } from '@proc7ts/fun-events';
import { lazyValue } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { CxPeerBuilder } from '../peer-builder';
import { CxAsset$Derived, CxAsset$Provided } from './asset.provided.impl';
import { CxEntry$Target } from './entry.target.impl';

export class CxEntry$Record<TValue, TAsset, TContext extends CxValues> {

  readonly target: CxEntry.Target<TValue, TAsset, TContext>;
  readonly supply: Supply;
  private readonly define: () => CxEntry.Definition<TValue>;
  private readonly assets = new Map<Supply, CxAsset<TValue, TAsset, TContext>>();
  private readonly senders = new Map<Supply, CxEntry$AssetSender<TValue, TAsset, TContext>>();

  constructor(
      readonly builder: CxPeerBuilder<TContext>,
      readonly entry: CxEntry<TValue, TAsset>,
  ) {
    this.supply = new Supply().needs(builder.supply);
    this.target = new CxEntry$Target(this, new Supply().needs(builder.supply));
    this.define = lazyValue(() => entry.perContext(this.target));
  }

  provide(asset: CxAsset<TValue, TAsset, TContext>): Supply {

    const { supply = new Supply() } = asset;

    supply.needs(this.supply);

    this.assets.set(supply, asset);
    supply.whenOff(() => this.assets.delete(supply));

    for (const [trackingSupply, sender] of this.senders) {
      this.sendAssets(
          sender,
          asset,
          new Supply().needs(supply).needs(trackingSupply),
      );
    }

    asset.setupAsset?.(new CxEntry$Target(this, supply));

    return supply;
  }

  get(request: CxRequest<TValue> = {}): TValue | null {

    const { by = CxRequestMethod.Fallback, or, set = CxEntry$dontSet } = request;
    const definition = this.define();

    let resultBy: CxRequestMethod | undefined;
    let result: TValue | null | undefined;

    if (by >= 0 /* unless default value requested */) {

      // Request explicitly provided value.
      definition.assign?.(
          (value: TValue, by = CxRequestMethod.Assets): void => {
            resultBy = by;
            result = value;
          },
          request,
      );

      if (resultBy != null /* value received */) {

        if (resultBy >= 0 /* either explicitly provided, or fallback value received */) {
          // Report and return it.
          set(result!, resultBy);
          return result!;
        }

        // Default value received...

        if (by /* ...but explicitly provided value requested */
            && or === undefined /* ...and no fallback specified */) {
          // This is not acceptable.
          throw new CxReferenceError(this.entry, `No value provided for ${this.entry}`);
        }

        // ...go on with default value.
      }

      if (or !== undefined /* fallback specified */) {
        // Report and return fallback value.
        set(or, CxRequestMethod.Fallback);
        return or;
      }
    }

    if (resultBy == null /* unless (default) value received already */) {
      if (definition.assignDefault) {
        // Request default value.
        definition.assignDefault(
            (value: TValue, by = CxRequestMethod.Defaults): void => {
              resultBy = by;
              result = value;
            },
            request,
        );
      } else if (by < 0 /* default value requested and there is no `assignDefault()` method */) {
        // Request the value with `assign()` method, is it may provide default value instead.
        definition.assign?.(
            (value: TValue, by = CxRequestMethod.Assets): void => {
              resultBy = by;
              result = value;
            },
            request,
        );
      }
    }

    if (resultBy != null /* value received (from either `assign()` or `assignDefault()` call) */) {

      if (resultBy <= 0 /* either default, or fallback value received */) {
        // Report and return it.
        set(result!, resultBy);
        return result!;
      }

      if (or === undefined /* no fallback specified */) {

        // Explicitly provided value received...

        if (by < 0 /* ...but default value requested */) {
          // This is not acceptable.
          throw new CxReferenceError(this.entry, `The ${this.entry} has no default value`);
        }

        // ...report and return explicitly provided value.
        set(result!, resultBy);

        return result!;
      }
    }

    // No acceptable value received.

    if (by < 0 /* default value requested */ && or !== undefined /* ...and fallback specified */) {
      // Report and return fallback value.
      set(or, CxRequestMethod.Fallback);
      return or;
    }

    // Nothing to return.
    throw new CxReferenceError(this.entry);
  }

  eachAsset(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    if (target.supply.isOff) {
      return;
    }

    let goOn = true;
    const cb: CxAsset.Collector<TAsset> = asset => goOn = !target.supply.isOff
        && callback(asset) !== false
        && !target.supply.isOff;

    for (const peer of this.builder._peers) {
      peer.eachAsset(target, cb);
      if (!goOn) {
        return;
      }
    }

    for (const asset of this.assets.values()) {
      asset.placeAsset(target, cb);
      if (!goOn) {
        break;
      }
    }
  }

  eachRecentAsset(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    if (target.supply.isOff) {
      return;
    }

    let goOn = true;
    const cb: CxAsset.Callback<TAsset> = asset => goOn = !target.supply.isOff
        && callback(asset) !== false
        && !target.supply.isOff;

    // Iterate in most-recent-first order.
    for (const asset of [...this.assets.values()].reverse()) {
      asset.placeAsset(target, cb);
      if (!goOn) {
        return;
      }
    }

    // Do the same for peers in most-recent-first order.
    const peers = this.builder._peers;

    for (let i = peers.length - 1; i >= 0; --i) {
      peers[i].eachRecentAsset(target, cb);
      if (!goOn) {
        return;
      }
    }
  }

  trackAssets(
      target: CxEntry.Target<TValue, TAsset, TContext>,
      receiver: CxAsset.Receiver<TAsset>,
      { supply = new Supply() }: CxTracking = {},
  ): Supply {

    const rcv: EventReceiver.Generic<[CxAsset.Provided<TAsset>]> = {
      supply,
      receive(_ctx, asset) {
        receiver(asset);
      },
    };
    const emitter = new EventEmitter();

    emitter.supply.needs(target);
    emitter.on(rcv);

    const sender: CxEntry$AssetSender<TValue, TAsset, TContext> = [target, emitter];

    this.senders.set(supply, sender);
    supply.whenOff(() => this.senders.delete(supply));

    let rankOffset = 1;

    for (const peer of this.builder._peers) {

      const firstRank = rankOffset;

      rankOffset += peer.rankCount;
      peer.trackAssets(
          target,
          provided => receiver(new CxAsset$Derived(provided, firstRank + provided.rank)),
          supply,
      );
    }

    for (const [assetSupply, asset] of this.assets) {
      this.sendAssets(
          sender,
          asset,
          new Supply().needs(assetSupply).needs(supply),
      );
    }

    return supply;
  }

  private sendAssets(
      [target, emitter]: CxEntry$AssetSender<TValue, TAsset, TContext>,
      asset: CxAsset<TValue, TAsset>,
      supply: Supply,
  ): void {
    emitter.send(new CxAsset$Provided(target, asset, supply));
  }

}

type CxEntry$AssetSender<TValue, TAsset, TContext extends CxValues> = readonly [
  target: CxEntry.Target<TValue, TAsset, TContext>,
  emitter: EventEmitter<[CxAsset.Provided<TAsset>]>,
];

function CxEntry$dontSet(_value: unknown, _by: CxRequestMethod): void {
  // Do not set the value.
}
