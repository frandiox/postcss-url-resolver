var postcss = require('postcss');
var lib = require('./lib.js');

module.exports = postcss.plugin('postcss-url-resolver', function (options) {
  // Work with options here
  var defaults = {
    recursive: true,
    modernBrowser: false,
    userAgent: null,
    base64: false,
    request: function() { throw Error('\'options.request\' is required!') }
  };

  Object.keys(options || {})
    .forEach(function(key) { defaults[key] = options[key]; });

  return function urlResolver(root) {
    // Transform CSS AST here
    return importResolver(root, defaults);
  };
});

// Resolves `@import` CSS  statements recursively
function importResolver(root, options, resource) {
  var parentResource = resource || root.source.input.file;
  var imports = [];

  root.walkAtRules('import', function checkAtRule(atRule) {
    var params = postcss.list.space(atRule.params);
    var remoteFile = lib.cleanupUrl(params[0]);
    if (parentResource) {
      remoteFile = lib.relativeUrl(remoteFile, parentResource);
    }
    if (!lib.isUrl(remoteFile)) return;

    imports.push(
      lib.request(remoteFile, options)
      .then(function(response) {
        var newNode = postcss.parse(response.body);
        var mediaQueries = params.slice(1).join(' ');
        if (mediaQueries) {
          var mediaNode = postcss.atRule({
            name: 'media',
            params: mediaQueries
          });
          mediaNode.append(newNode);
          newNode = mediaNode;
        }

        return imageResolver(newNode, response.parentResource, options)
          .then(function() {
            return (options.recursive
              ? importResolver(newNode, options, response.parentResource)
              : Promise.resolve(newNode)
            ).then(function(root) { atRule.replaceWith(root); });
          });
      })
    );
  });

  return Promise.all(imports).then(function() { return root; });
}

// Resolves local paths in 'url(...)' to remote urls - Optionally in base64
function imageResolver(root, base, options) {
  var resource = root.source.input.file;
  var urls = [];

  root.walkDecls(PROP_REGEX, decl => {
    var remoteUrl;
    decl.value = decl.value.replace(URL_REGEX, function(match, url) {
      remoteUrl = lib.relativeUrl(url, base);
      return lib.wrapUrl(remoteUrl);
    });

    if (options.base64 && typeof remoteUrl === 'string') {
      urls.push(
        lib.request(remoteUrl, options)
          .then(function(response) {
            var ext = remoteUrl.substr(remoteUrl.lastIndexOf('.') + 1);
            if (ext === 'svg') ext += '+xml';

            decl.value = decl.value.replace(URL_REGEX, function(match, url) {
              return lib.wrapUrl('data:image/' + ext + ';base64,' + lib.btoa(response.body));
            });
          })
      );
    }
  });

  return Promise.all(urls);
}

var URL_REGEX = /url\(\s*['"]?(?!['"]?data:)(.*?)['"]?\s*\)/g;
var PROP_REGEX = /^(-(webkit|moz|o|ms)-)?(?=--|cue|play|mask|background|content|src|cursor|list-style)/;
