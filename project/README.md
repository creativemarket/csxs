# {{name}}

### Requirements

With the automated build system, [Flash Builder](http://www.adobe.com/products/flash-builder.html)
and the [CS Extension Builder Plugin](http://www.adobe.com/devnet/creativesuite/cs-extension-builder.html)
are not needed to compile, test, or package extensions. This means you can use Sublime Text or any other
editor for development.

  * Download the [Creative Suite SDK](http://www.adobe.com/devnet/creativesuite.html)
  * Set the SDK path: `export CSSDK=[location]`
  * [Build and Install Node.js](https://github.com/joyent/node/wiki/Installation)
  * Install [NPM](http://npmjs.org/): `curl http://npmjs.org/install.sh | sh`
  * Install [csxs](https://github.com/creativemarket/csxs): `npm install -g csxs`

## Development

```sh
# compiles, installs, and puts photoshop into debug mode:
$ csxs debug
```

### Available Options

<table width="100%">
	<tr>
		<td><code>--help</code></td>
		<td>Displays all available build targets.</td>
	</tr>
	<tr>
		<td><code>--cs-version</code></td>
		<td>The version of Creative Suite to launch when debugging. If not provided, the newest version will be used.</td>
	</tr>
	<tr>
		<td><code>--flex-version</code></td>
		<td>Overrides "flex-version" set in csxs.json.</td>
	</tr>
	<tr>
		<td><code>--fdb</code></td>
		<td>If not provided, debug mode will show a live view of "flashlog.txt" instead of attempting to start the Flex debugger.</td>
	</tr>
	<tr>
		<td><code>--no-compile</code></td>
		<td>When used with the "debug" target, this will disable the compilation step.</td>
	</tr>
	<tr>
		<td><code>--launch</code></td>
		<td>When used with the "debug" target, this will cause a new instance of Creative Suite to be launched.</td>
	</tr>
</table>

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