# {{title}}

### Requirements

With the automated build system, [Flash Builder](http://www.adobe.com/products/flash-builder.html)
and the [CS Extension Builder Plugin](http://www.adobe.com/devnet/creativesuite/cs-extension-builder.html) are not
needed to compile, test, or package extensions. This means you can use Sublime Text or any other editor
for development.

  * Download the [Creative Suite SDK](http://www.adobe.com/devnet/creativesuite.html)
  * Set the SDK path: `export CSSDK=[location]`
  * [Build and Install Node.js](https://github.com/joyent/node/wiki/Installation)
  * Install [NPM](http://npmjs.org/): `curl http://npmjs.org/install.sh | sh`
  * Install [csxs](https://github.com/diy/roto): `npm install -g csxs`

## Footnotes

Though not required, Flash Builder can be used for Extension Development.

  * http://www.adobe.com/products/flash-builder.html
  * http://www.adobe.com/devnet/creativesuite/cs-extension-builder.html

Before starting Flash Builder, run `csxs configure` to generate necessary project files.