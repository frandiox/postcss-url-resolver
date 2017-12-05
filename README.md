# PostCSS Url Resolver [![Build Status][ci-img]][ci]

[PostCSS] plugin that resolves urls (CSS imports and images) via http requests. Isomorphic (node + browser).

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/frandiox/postcss-url-resolver.svg
[ci]:      https://travis-ci.org/frandiox/postcss-url-resolver

```css
.foo {
    /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

```js
postcss([ require('postcss-url-resolver') ])
```

See [PostCSS] docs for examples for your environment.
