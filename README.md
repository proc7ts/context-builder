# IoC Context Builder

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![Coverage][coverage-img]][coverage-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

This library allows to build an [IoC] context conforming to [@proc7ts/context-values] API.

[npm-image]: https://img.shields.io/npm/v/@proc7ts/context-builder.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/@proc7ts/context-builder
[build-status-img]: https://github.com/proc7ts/context-builder/workflows/Build/badge.svg
[build-status-link]: https://github.com/proc7ts/context-builder/actions?query=workflow:Build
[quality-img]: https://app.codacy.com/project/badge/Grade/73faff6037244e9eae5b408c61a5077b
[quality-link]: https://www.codacy.com/gh/proc7ts/context-builder/dashboard?utm_source=github.com&utm_medium=referral&utm_content=proc7ts/context-builder&utm_campaign=Badge_Grade
[coverage-img]: https://app.codacy.com/project/badge/Coverage/73faff6037244e9eae5b408c61a5077b
[coverage-link]: https://www.codacy.com/gh/proc7ts/context-builder/dashboard?utm_source=github.com&utm_medium=referral&utm_content=proc7ts/context-builder&utm_campaign=Badge_Coverage
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/proc7ts/context-builder
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://proc7ts.github.io/context-builder/
[ioc]: https://en.wikipedia.org/wiki/Inversion_of_control
[@proc7ts/context-builder]: https://www.npmjs.com/package/@proc7ts/context-builder
[@proc7ts/context-values]: https://www.npmjs.com/package/@proc7ts/context-values

## Creating Context

[IoC] context interface may be any. The only required method is `get()`.

[CxBuilder] constructor accepts context builder function as its first parameter:

```typescript
import { CxBuilder } from '@proc7ts/context-builder';
import { CxEntry, cxSingle, CxValues } from '@proc7ts/context-values';

export interface Foo = string;

export const Foo: CxEntry<Foo> = {
  perContext: cxSingle({ byDefault: () => 'default' }),
  toString: () => '[Foo]',
}

// Custom context interface.
export interface MyContext extends CxValues {

  readonly name: string;

  readonly foo: Foo;

}

const cxBuilder = new CxBuilder<MyContext>(get => (/* MyContext */ {
  get,
  name: 'MyContext',
  get foo() {
    return this.get(Foo);
  },
}));

const context: MyContext = cxBuilder.context;
```

[cxbuilder]: https://proc7ts.github.io/context-builder/classes/CxBuilder.html

## Providing Assets

A `provide` method of `CxBuilder` can be used to provide an asset for context entry.

The entry asset is an object implementing [CxAsset] interface.

The [@proc7ts/context-builder] contains several asset implementations suitable for most use cases:

- [cxAliasAsset()] - Asset aliasing other context entry value.
- [cxBuildAsset()] - Builds asset with the given builder function.
- [cxConstAsset()] - Constant asset.
- [cxTrackAsset()] - Tracks for value asset updates.

```typescript
import { cxAliasAsset, CxBuilder, cxConstAsset } from '@proc7ts/context-builder';
import { CxEntry, cxSingle } from '@proc7ts/context-values';

const Foo: CxEntry<string> = {
  perContext: cxSingle(),
  toString: () => '[Foo]',
};
const Bar: CxEntry<string> = {
  perContext: cxSingle(),
  toString: () => '[Bar]',
};

const cxBuilder = new CxBuilder(get => ({ get }));

cxBuilder.provide(cxConstAsset(Foo, 'foo'));
cxBuilder.provide(cxAliasAsset(Bar, Foo));

cxBuilder.get(Bar); // 'foo'
```

[cxasset]: https://proc7ts.github.io/context-values/interfaces/CxAsset.html
[cxaliasasset()]: https://proc7ts.github.io/context-builder/modules.html#cxAliasAsset
[cxbuildasset()]: https://proc7ts.github.io/context-builder/modules.html#cxBuildAsset
[cxconstasset()]: https://proc7ts.github.io/context-builder/modules.html#cxConstAsset
[cxtrackasset()]: https://proc7ts.github.io/context-builder/modules.html#cxTrackAsset

## Context Peers

A context peer provides assets for one or more contexts. When one or more context peers passed to context builder, the
assets provided by those peers precede the assets provided by builder.

A [CxPeerBuilder] class can be used as a context peer. It is similar to [CxBuilder], but does not build any context by
itself. The [CxBuilder] extends [CxBuilder] and can also be used as a peer of another context.

```typescript
import { cxBuildAsset, CxBuilder, cxConstAsset, CxPeerBuilder } from '@proc7ts/context-builder';
import { CxEntry, cxSingle } from '@proc7ts/context-values';

const cxBaseBuilder = new CxPeerBuilder();

// Derive contexts from common base peer.
const cxBuilder1 = new CxBuilder(get => ({ get }), cxBaseBuilder);
const cxBuilder2 = new CxBuilder(get => ({ get }), cxBaseBuilder);

const BaseEntry: CxEntry<string> = {
  perContext: cxSingle(),
  toString: () => '[BaseEntry]',
};
const DerivedEntry: CxEntry<string> = {
  perContext: cxSingle(),
  toString: () => '[DerivedEntry]',
};

// Provide base peer assets.
cxBaseBuilder.provide(cxConstAsset(BaseEntry, 'initial'));
cxBaseBuilder.provide(cxBuildAsset(DerivedAsset, target => target.get(BaseAsset) + '!'));

// Override base asset in derived context.
cxBuilder2.provide(cxConstAsset(BaseEntry, 'overridden'));

// Derive value from base assets.
cxBuilder1.get(DerivedAsset); // 'initial!'

// Refer overridden asset.
cxBuilder2.get(DerivedAsset); // 'overridden!'
```

[cxpeerbuilder]: https://proc7ts.github.io/context-builder/classes/CxPeerBuilder.html
