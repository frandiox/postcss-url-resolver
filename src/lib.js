var url = require('url');
var trim = require('lodash.trim');

module.exports = {

    // Whether it is url-like syntax
    isUrl: function (string) {
        return /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(string); // eslint-disable-line max-len
    },

    // Concat relative urls
    relativeUrl: function (link, source) {
        if (!link || !source) return source;

        var pat = /^https?:\/\//i;
        return !pat.test(link) ? url.resolve(source, link) : link;
    },

    // Adapt url string style
    cleanupUrl: function (string) {
        if (string.substr(0, 3) === 'url') {
            string = string.substr(3);
        }
        return trim(string, '\'"()');
    },

    wrapUrl: function (value) {
        return 'url(\'' + value + '\')';
    },

    request: function (remoteFile, options) {
        var reqOptions = url.parse(remoteFile);

        return options
            .request(reqOptions)
            .then(function (body) {
                return {
                    body: body,
                    parent: remoteFile
                };
            });
    },

    btoa: (function () {
        /* global window Buffer */
        if (typeof window !== 'undefined' && window.btoa) {
            return window.btoa.bind(window);
        } else if (typeof Buffer !== 'undefined') {
            return function (string) {
                return new Buffer(string).toString('base64');
            };
        }
        throw Error('btoa function not found');
    }())
};
