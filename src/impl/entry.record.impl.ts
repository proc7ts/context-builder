import { CxAsset, CxEntry, CxReferenceError, CxRequest, CxValues } from '@proc7ts/context-values';
import { EventEmitter, EventReceiver, eventReceiver } from '@proc7ts/fun-events';
import { lazyValue, valueProvider } from '@proc7ts/primitives';
import { alwaysSupply, Supply } from '@proc7ts/supply';
import { CxBuilder } from '../builder';
import { CxSupply } from '../entries';
import { CxAsset$collector, CxAsset$Derived, CxAsset$Provided } from './asset.provided.impl';
import { CxEntry$Target } from './entry.target.impl';

export class CxEntry$Record<TValue, TAsset, TContext extends CxValues> {

  private readonly define: () => CxEntry.Definition<TValue>;
  private readonly assets = new Map<Supply, CxAsset<TValue, TAsset>>();
  private readonly senders = new Map<Supply, CxEntry$AssetSender<TValue, TAsset>>();
  readonly supply: (this: void) => Supply;

  constructor(
      readonly builder: CxBuilder<TContext>,
      readonly entry: CxEntry<TValue, TAsset>,
  ) {
    this.supply = entry === CxSupply as CxEntry<any>
        ? valueProvider(alwaysSupply())
        : lazyValue(() => new Supply().needs(builder.context.get(CxSupply)));
    this.define = lazyValue(() => entry.perContext(new CxEntry$Target(this, this.supply)));
  }

  provide(asset: CxAsset<TValue, TAsset>): Supply {

    const { supply = new Supply() } = asset;

    this.assets.set(supply, asset);
    supply.whenOff(() => this.assets.delete(supply));

    for (const [trackingSupply, sender] of this.senders) {
      this.sendAssets(
          sender,
          asset,
          new Supply().needs(supply).needs(trackingSupply),
      );
    }

    asset.setupAsset?.(new CxEntry$Target(this, () => supply.needs(this.supply())));

    return supply;
  }

  get({ or }: CxRequest<TValue> = {}): TValue | null {

    let hasValue = false;
    let value: TValue | undefined;

    const definition = this.define();
    const assigner = (newValue: TValue): void => {
      hasValue = true;
      value = newValue;
    };

    definition.assign?.(assigner);

    if (hasValue) {
      return value!;
    }
    if (or !== undefined) {
      return or;
    }

    definition.assignDefault?.(assigner);
    if (hasValue) {
      return value!;
    }

    throw new CxReferenceError(this.entry);
  }

  eachAsset(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    if (target.supply.isOff) {
      return;
    }

    let goOn: unknown;
    const cb: CxAsset.Callback<TAsset> = asset => goOn = !target.supply.isOff
        && callback(asset) !== false
        && !target.supply.isOff;

    this.builder._initial.eachAsset(target, cb);

    if (goOn !== false) {

      const collector = CxAsset$collector(target, cb);

      for (const asset of this.assets.values()) {
        asset.placeAsset(target, collector);
        if (goOn === false) {
          break;
        }
      }
    }
  }

  eachRecentAsset(
      target: CxEntry.Target<TValue, TAsset>,
      callback: CxAsset.Callback<TAsset>,
  ): void {
    if (target.supply.isOff) {
      return;
    }

    let goOn = true;
    const collector = CxAsset$collector(
        target,
        asset => goOn = !target.supply.isOff && callback(asset) !== false && !target.supply.isOff,
    );

    // Iterate in reverse order.
    for (const asset of [...this.assets.values()].reverse()) {
      asset.placeAsset(target, collector);
      if (!goOn) {
        return;
      }
    }

    // Do the same for initial assets.
    this.builder._initial.eachRecentAsset(target, callback);
  }

  trackAssets(
      target: CxEntry.Target<TValue, TAsset>,
      receiver: EventReceiver<[CxAsset.Provided<TAsset>]>,
  ): Supply {

    const rcv = eventReceiver(receiver);
    const trackingSupply = rcv.supply;
    const emitter = new EventEmitter();

    emitter.supply.needs(target);
    emitter.on(rcv);

    const sender: CxEntry$AssetSender<TValue, TAsset> = [target, emitter];

    this.senders.set(trackingSupply, sender);
    trackingSupply.whenOff(() => this.senders.delete(trackingSupply));

    this.builder._initial.trackAssets(
        target,
        {
          supply: trackingSupply,
          receive: (ecx, provided) => rcv.receive(
              ecx,
              new CxAsset$Derived(provided),
          ),
        },
    ).needs(trackingSupply);

    for (const [assetSupply, iterator] of this.assets) {
      this.sendAssets(
          sender,
          iterator,
          new Supply().needs(assetSupply).needs(trackingSupply),
      );
    }

    return trackingSupply;
  }

  private sendAssets(
      [target, emitter]: CxEntry$AssetSender<TValue, TAsset>,
      asset: CxAsset<TValue, TAsset>,
      supply: Supply,
  ): void {
    emitter.send(new CxAsset$Provided(target, asset, supply));
  }

}

type CxEntry$AssetSender<TValue, TAsset> = readonly [
  target: CxEntry.Target<TValue, TAsset>,
  emitter: EventEmitter<[CxAsset.Provided<TAsset>]>,
];
