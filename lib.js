var url = require('url');
var trim = require('lodash.trim');

// REQUIREMENTS:
// * Promise polyfill
// * Provie options.request, function returning a promise which resolves to response.body

module.exports = {

  // Wether it is url-like syntax
  isUrl: function(string) {
    return /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(string);
  },

  // Concat relative urls
  relativeUrl: function(link, source) {
    if (!link) return source;
    if (!source) return;

    var pat = /^https?:\/\//i;
    return !pat.test(link) ? url.resolve(source, link) : link;
  },

  // Adapt url string style
  cleanupUrl: function(url) {
    if (url.substr(0, 3) === 'url') {
      url = url.substr(3);
    }
    return trim(url, '\'"()');
  },

  wrapUrl: function(value) {
    return 'url(\'' + value + '\')';
  },

  request: function(remoteFile, options) {
    var reqOptions = url.parse(remoteFile);

    reqOptions.headers = {};
    if (options.modernBrowser) {
      reqOptions.headers['user-agent'] = 'Mozilla/5.0 AppleWebKit/538.0 Chrome/54.0 Safari/538';
    }
    if (options.userAgent) {
      reqOptions.headers['user-agent'] = String(options.userAgent);
    }

    return options
      .request(reqOptions)
      .then(function(body) {
        return {
          body: body,
          parentResource: remoteFile
        };
      });
  },

  btoa: (function() {
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa.bind(window);
    } else if (typeof Buffer !== 'undefined') {
      return function(string) {
        return new Buffer(string).toString('base64');
      };
    }
    throw Error('btoa function not found');
  })()
};
