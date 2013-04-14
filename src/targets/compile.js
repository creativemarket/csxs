/**
 * Copyright (c) 2013 Creative Market
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@creativemarket.com>
 */

var fs     = require('fs');
var path   = require('path');
var spawn  = require('child_process').spawn;
var exec   = require('child_process').exec;

module.exports = function(roto) {
	roto.addTarget('compile', {
		description: 'Compiles SWFs, ready for packaging / testing.',
	}, function(options) {

		// configure environment
		roto.addTask('target:configure', options);

		var profile      = options.debug !== false ? 'debug' : 'release';
		var ver_flex     = options['flex-version'] || config['flex-version'];
		var ver_cs       = parseInt(options['cs-version'] || config['cs-version'], 10);
		var folder_src   = './src';
		var folder_build = './build/bin-' + profile;
		var folder_cssdk = process.env.CSSDK;
		var folder_flex  = folder_cssdk + '/CS Flex SDK ' + ver_flex;
		var bin_amxmlc   = IS_WINDOWS ? 'amxmlc.exe' : 'amxmlc';
		var path_amxmlc  = path.normalize(folder_flex + '/bin/' + bin_amxmlc);

		// resolve swc library paths
		roto.addTask(function(callback) {
			console.log('Resolving SWC dependencies...');
			if (!pkg.flex.hasOwnProperty(ver_flex)) {
				console.error(roto.colorize('ERROR: ', 'red') + 'Invalid Flex version number "' + ver_flex + '".');
				return callback(false);
			}

			var libs = pkg.flex[ver_flex];
			for (var i = 0, n = libs.length; i < n; i++) {
				libs[i] = path.resolve(folder_cssdk, libs[i]);
				if (!fs.existsSync(libs[i])) {
					console.error(roto.colorize('ERROR: ', 'red') + 'Unable to find "' + libs[i] + '"');
					return callback(false);
				}
			}

			callback();
		});

		// check for compiler
		roto.addTask(function(callback) {
			console.log('Checking for compiler...')
			if (!fs.existsSync(path_amxmlc)) {
				console.error(roto.colorize('ERROR: ', 'red') + 'Unable to find Adobe application compiler at:');
				console.error('"' + path_amxmlc + '"');
				return callback(false);
			}
			callback();
		});

		// prepare build directory
		roto.addTask('dir-remove', {path: folder_build});
		roto.addTask('dir-copy', {from: './assets', to: folder_build + '/assets'});

		roto.addTask('template', {
			files  : 'src/manifest.cs' + ver_cs + '.xml',
			output : folder_build + '/CSXS/manifest.xml',
			data   : config
		});

		// copy jsx scripts
		roto.addTask(function(callback) {
			process.stdout.write('Copying *.jsx scripts... ');
			copySync(folder_src + '/ID.jsx', folder_build + '/ID.jsx', 'utf8');
			process.stdout.write('[' + roto.colorize('success', 'green') + ']\n');
			callback();
		});

		// execute flex compiler
		var compile_mxml = function(path_mxml, path_swf) {
			var beautify_output = function(str) {
				return String(str)
					.replace(/(.+?) line: (\d+)(?: col:? \d+)?Warning: ([^\n]+)/g, roto.colorize('$1', 'white') + ' line $2\n' + roto.colorize('WARNING: $3', 'yellow')) // warnings
					.replace(/(.+?)\((\d+)\): (?:col:? \d+ )?Warning: ([^\n]+)/g, roto.colorize('$1', 'white') + ' line $2\n' + roto.colorize('WARNING: $3', 'yellow')) // warnings
					.replace(/([^\r\n]*?)\((\d+)\): col: (\d+):?/, roto.colorize('$1', 'white') + ' line $2 col $3') // errors
					.replace(/Error: ([^\r\n]+)/g, '\n' + roto.colorize('ERROR: $1', 'red')) // errors
					.replace(/(^|\n)[\t ]*\^[\t ]*(\n|$)/g, '$2') // pointers
					.replace(/\s{2,}/g, '\n') // consecutive whitespace
					.replace(/^\s+/, '') // leading line breaks
					.replace(/\s+$/, ''); // trailing line breaks
			};
			roto.addTask(function(callback) {
				var args = [
					'-verify-digests',
					'-warnings=true',
					'-use-network=true',
					'-compiler.strict=true',
					'-compiler.show-binding-warnings=true',
					'-compiler.show-deprecation-warnings=true',
					'-compiler.debug=' + String(profile === 'debug'),
					'-includes=mx.managers.systemClasses.MarshallingSupport',
					'-locale=en_US',
					'-output=' + path_swf,
					'-library-path+=' + pkg.flex[ver_flex].join(','),
					'-define=CONFIG::debug,' + String(profile === 'debug'),
					'-define=CONFIG::release,' + String(profile === 'release'),
					'-define=CONFIG::version,"' + config.version + '"',
					'--source-path', folder_src, '--', path_mxml
				];
				console.log(roto.colorize('amxmlc ' + args.join(' '), 'magenta'));

				var amxmlc = spawn(path_amxmlc, args);
				amxmlc.stdout.on('data', function (data) { console.log(beautify_output(data)); });
				amxmlc.stderr.on('data', function (data) { console.error(beautify_output(data)); });
				amxmlc.on('exit', function(code) {
					if (code !== 0) {
						console.error(roto.colorize('"' + path_swf + '"', '') + ' [' + roto.colorize('fail', 'red') + ']');
						return callback(false);
					}
					console.log(roto.colorize('"' + path_swf + '"', '') + ' [' + roto.colorize('success', 'green') + ']');
					return callback();
				});
			});
		};

		compile_mxml(folder_src + '/ID.mxml', folder_build + '/ID.swf');
	});
};