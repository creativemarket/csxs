# {{name}}

### Requirements

With the [CSXS](https://github.com/creativemarket/csxs) automated build system, [Flash Builder](http://www.adobe.com/products/flash-builder.html)
and the [CS Extension Builder Plugin](http://www.adobe.com/devnet/creativesuite/cs-extension-builder.html)
are not needed to compile, test, or package the extension. This means you can use Sublime Text or any other
editor for development.

  * Download the [Creative Suite SDK](http://www.adobe.com/devnet/creativesuite.html)
  * Set the SDK path: `export CSSDK=[location]`
  * [Build and Install Node.js](https://github.com/joyent/node/wiki/Installation)
  * Install [NPM](http://npmjs.org/): `curl http://npmjs.org/install.sh | sh`
  * Install [csxs](https://github.com/creativemarket/csxs): `npm install -g csxs`

## Development

```sh
# compiles, installs, and puts photoshop into debug mode
$ csxs debug --cs-version=6 --cs-product=photoshop
```

### Available Options

<table width="100%">
	<tr>
		<td><code>--help</code></td>
		<td>Displays all available build targets.</td>
	</tr>
	<tr>
		<td><code>--launch</code></td>
		<td>Launches a new instance of the selected Creative Suite application.</td>
	</tr>
	<tr>
		<td><code>--cs-version</code></td>
		<td>Creative Suite version (e.g. "5", "5.5", "6").</td>
	</tr>
	<tr>
		<td><code>--cs-product</code></td>
		<td>Creative Suite application (e.g. "photoshop", "illustrator", etc).</td>
	</tr>
	<tr>
		<td><code>--fdb</code></td>
		<td>Use Flex Debugger instead of live display of "flashlog.txt" contents.</td>
	</tr>
	<tr>
		<td><code>--no-compile</code></td>
		<td>Disables the compilation step.</td>
	</tr>
</table>

## Packaging

To build a *.zxp installer without publishing the extension, run:

```sh
$ csxs package
```

## Public Releases

First update ["csxs.json"](https://github.com/creativemarket/csxs/blob/master/docs/configuration.md)
with a new version number. Next, create a changelog file in ["changes/"](changes/) that outlines
what has changed since the previous version (this description is user-facing, so don't be too
technical). When that's all set, run `csxs changelogs` to update aggregated changelogs, commit
your changes, and run:

```sh
# compiles, packages, and deploys to S3:
$ csxs publish
```

## Footnotes

Though not required, Flash Builder can be used for extension development.

  * http://www.adobe.com/products/flash-builder.html
  * http://www.adobe.com/devnet/creativesuite/cs-extension-builder.html

Before starting Flash Builder, run `csxs configure` to generate necessary project files.