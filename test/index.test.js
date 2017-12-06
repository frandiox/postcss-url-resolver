var postcss = require('postcss');
var plugin = require('../src');
var fs = require('fs');
var path = require('path');

var remote = 'http://test.io/';
var resolve = string => path.resolve(__dirname, string);

var run = (input, output, opts) => {
  return postcss([ plugin(opts) ])
    .process(input, { from: remote })
    .then(result => {
      expect(result.css).toEqual(output);
      expect(result.warnings().length).toBe(0);
    })
    .catch(err => err.message); // Jest bug with rejected promises
};

var request = opt => {
  var url = resolve(opt.href.replace(remote, ''));
  return new Promise((resolve, reject) => {
    fs.readFile(url, (err, data) => err ? reject(err) : resolve(data));
  });
};

var concat = function() {
  var result = '';
  for(var i = 0; i < arguments.length; i++) {
    result += arguments[i] + '\n';
  }
  return result.slice(0, -1);
};

var red = 'body { color: red; }';
var green = 'body { color: green; }';
var blue = 'body { color: blue; }';
var grey = 'body { color: grey; }';
var image = `body { background: url('${remote}dir/image.svg'); }`;
var b64 = new Buffer('<svg></svg>\n').toString('base64');
var image64 = `body { background: url('data:image/svg+xml;base64,${b64}'); }`;
var fixture1_remote = `@import url('${remote}fixture1.css');`;
var fixture2_local = `@import url('./dir/fixture2.css');`;

var input = concat(green, fixture1_remote);

it('resolves imports non recursively', () => {
  var output = concat(green, grey, fixture2_local, blue);

  return run(input, output, { request: request, recursive: false });
});

it('excludes imports', () => {
  var output = concat(green, grey, fixture2_local, blue);

  return run(input, output, { request: request, exclude: /fixture2.css$/ });
});

it('resolves images and imports recursively', () => {
  var output = concat(green, grey, red, image, blue);

  return run(input, output, { request: request });
});

it('inlines images in base64', () => {
  var output = concat(green, grey, red, image64, blue);

  return run(input, output, { request: request, base64: true });
});

it('ignores non-url imports', () => {
  var input = `@import url('./not/an/url');`;
  return run(input, input, { request: request });
});

it('requires options.request paremeter', () => {
  return expect(run(input, '', {}))
    .resolves.toMatch(/options\.request/); // Jest bug with rejected promises
});
