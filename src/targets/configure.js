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
	roto.addTarget('configure', {
		description: 'Configures build environment (Determines CS and Flex SDK locations).'
	}, function(options) {

		roto.addTask(function(callback) {
			if (!process.env.CSSDK || !fs.existsSync(process.env.CSSDK)) {
				console.error(roto.colorize('ERROR: ', 'red') + 'Unable to find Adobe Creative Suite SDK.');
				console.error('Download it and set CSSDK to its location.');
				console.error(roto.colorize('http://www.adobe.com/devnet/creativesuite.html', 'underline'));
				console.error(roto.colorize('export CSSDK=(path)', 'gray'));
				return callback(false);
			} else {
				console.log('CSSDK=' + process.env.CSSDK);
			}
			callback();
		});

		// configuration for flash builder
		roto.addTask(function(callback) {
			if (options.debug !== false) {
				config.id   += '.debug';
				config.name += ' (debug)';
			}
			callback();
		});

		roto.addTask('template', {
			files  : 'src/ID.mxi',
			output : './ID.mxi',
			data   : config
		});

		// (only used by flash builder)
		if (IS_MAC) {
			var symlink = function(from, to) {
				roto.addTask(function(callback) {
					var args = ['-s', from, to];
					console.log(roto.colorize('ln ' + args.join(' '), 'magenta'));
					var ln = spawn('ln', args);
					ln.on('exit', function() { callback(); });
				});
			};

			symlink('./src/ID.jsx', './ID.jsx');
		}

		roto.addTask('template', {
			files  : 'src/manifest.cs6.xml',
			output : '.staged-extension/CSXS/manifest.xml',
			data   : config
		});

	});
};