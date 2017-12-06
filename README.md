# PostCSS Url Resolver [![Build Status][ci-img]][ci]

[PostCSS] plugin that resolves urls (CSS imports and images) via http requests.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/frandiox/postcss-url-resolver.svg
[ci]:      https://travis-ci.org/frandiox/postcss-url-resolver

This plugin is a combination of [`postcss-import-url`](https://github.com/unlight/postcss-import-url), [`postcss-url-mapper`](https://github.com/igoradamenko/postcss-url-mapper) and [`postcss-base64`](https://github.com/jelmerdemaat/postcss-base64). It borrows code from all of them and adds some extra features.

**Features**:

* Recursively resolves `@import` and `url(...)` of remote files.
* Optionally inlines images in base64.
* Isomorphic. Works in Node and the browser.
* HTTP client agnostic. It must be provided as a parameter. This also allows providing custom cache or headers.

**Requirements**:

* Native `Promise` or a polyfill.

**Examples**:

```css
/* http://some.remote/file.css */

@import "http://fonts.googleapis.com/css?family=Tangerine";

.bar {
  color: green;
  background-image: url('./img/logo.svg');
}
```

```css
/* Input example */

.foo {
  color: red;
}

@import url('http://some.remote/file.css');

.baz {
  color: blue;
}
```

```css
/* Output example */

.foo {
  color: red;
}

@font-face {
  font-family: 'Tangerine';
  font-style: normal;
  font-weight: 400;
  src: local('Tangerine'), url(http://fonts.gstatic.com/s/tangerine/v7/HGfsyCL5WASpHOFnouG-RKCWcynf_cDxXwCLxiixG1c.ttf) format('truetype')
}

.bar {
  color: green;
  background-image: url('http://some.remote/img/logo.svg');
}

.baz {
  color: blue;
}
```

If `options.base64` was specified (`true`), the `background-image` would look like:

```css
.bar {
  color: green;
  background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHNZz4=');
}
```

## Usage

This plugin is isomorphic (Node + browser environments). For sake of versatility, it does not bundle any http-request package. Therefore, it must be provided as a parameter.

#### Node

```js
var postcss = require('postcss');
var urlResolver = require('postcss-url-resolver');
var hh = require('http-https');

postcss([urlResolver({
  exclude: /theme.css$/,
  base64: true,

  request: function(opt) {
    return new Promise(function executor(resolve, reject) {
      var req = hh.get(reqOptions, function(res) {
          var body = '';

          res.on('data', function(chunk) {
            body += chunk.toString();
          });

          res.on('end', function() {
            resolve(body);
          });
      });

      req.on('error', reject);
      req.end();
    });
  }
})])
```

#### Browser (Webpack)

```js
import postcss from 'postcss';
import urlResolver from 'postcss-url-resolver';
import axios from 'axios';

postcss([ urlResolver({
  exclude: /theme.css$/,
  base64: true,

  request: function(opt) {
    return axios.get(opt.href)
      .then(res => res.data);
  }
})])
```

*Note: `axios` can also be used in Node environments.*

## Parameters

* `request`: Function called to make an HTTP request. It gets a [parsed URL object](https://github.com/defunctzombie/node-url#api) as its only parameter. Must return a promise which resolves to the response body (content). **Required**.
* `recursive`: Whether `@import` should be resolved recursively. *Default `true`*.
* `base64`: Resolves and inlines images in base 64. *Default `false`*.
* `exclude`: A RegExp matching urls that won't be resolved. *Default `null`*.

See [PostCSS] docs for examples for your environment.
