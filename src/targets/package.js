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
	roto.addTarget('package', {
		description: 'Generates signed *.zxp installer ready for distribution.'
	}, function(options) {
		var selfsign       = options['self-sign'];
		var folder_build   = './build/bin-release';
		var folder_package = './package';
		var keystore       = selfsign ? 'certificate-dev.p12' : config.certificate.location;
		var password       = selfsign ? 'password' : config.certificate.password;

		var build_zxp = function(options) {
			roto.addTask(function(callback) {
				var args = [
					'-jar',
					'./tools/ucf.jar',
					'-package',
					'-storetype', 'PKCS12',
					'-keystore', keystore,
					'-storepass', password,
					'-tsa', 'https://timestamp.geotrust.com/tsa',
					options.output,
					'-C', options.input, '.'
				];

				console.log(roto.colorize(options.output, 'white'));
				console.log(roto.colorize('java ' + args.join(' '), 'magenta'));

				var ucf = spawn('java', args);
				ucf.stdout.on('data', function (data) { console.log(data); });
				ucf.stderr.on('data', function (data) { console.error(data); });
				ucf.on('exit', function(code) {
					return callback();
				});
			});
		};

		roto.addTask('dir-remove', {path: folder_package});
		roto.addTask(function(callback) {
			fs.mkdir(folder_package, function() { callback(); });
		});

		// package extension (cs5)
		roto.addTask('target:compile', {'debug': false, 'cs-version': 5});
		build_zxp({
			'input'  : folder_build,
			'output' : folder_package + '/CS5.zxp'
		});

		// package extension (cs6)
		roto.addTask('target:compile', {'debug': false, 'cs-version': 6});
		build_zxp({
			'input'  : folder_build,
			'output' : folder_package + '/CS6.zxp'
		});

		// package hybrid extension
		roto.addTask(function(callback) {
			copySync('assets/icon-ext.png', folder_package + '/icon.png', 'binary');
			copySync('ID.mxi', folder_package + '/ID.mxi', 'utf8');
			callback();
		});

		build_zxp({
			'input'  : folder_package,
			'output' : 'ID.' + config.version + '.zxp'
		});

		roto.addTask(function(callback) {
			copySync('ID.' + config.version + '.zxp', 'ID.zxp', 'binary');
			callback();
		});

	});
};