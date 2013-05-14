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

var _      = require('lodash');
var fs     = require('fs');
var path   = require('path');
var spawn  = require('child_process').spawn;
var exec   = require('child_process').exec;
var uuid   = require('../lib/uuid.js');
var hosts  = require('../lib/hosts.js');


roto.addTarget('package', {
	description: 'Generates signed *.zxp installer ready for distribution.'
}, function(options) {
	var folder_build   = './build/bin-release';
	var folder_package = './package';
	var zxps = [];

	// load project configuration to `config` global
	roto.addTask('csxs.config_load');

	// certificate settings
	roto.addTask(function(callback) {
		if (!config.certificate) {
			config.certificate = {
				location: '.certificate-self.p12',
				password: 'password'
			};
			console.log(roto.colorize('WARNING: You should provide a certificate from a valid issuing', 'yellow'));
			console.log(roto.colorize('certificate authority (IA) to prevent warnings during installation.', 'yellow'));
			console.log(roto.colorize('http://cssdk.host.adobe.com/sdk/1.0/docs/WebHelp/programmers_guide/Deploy.htm', 'gray'));
			console.log(roto.colorize('https://github.com/creativemarket/csxs/blob/master/docs/configuration.md#certificate', 'gray'));

			if (!fs.existsSync(config.certificate.location)) {
				return roto.executeTask('target:certificate', {
					password : config.certificate.password,
					output   : config.certificate.location
				}, callback);
			}
		}
		callback();
	});

	// create temporary "package" directory
	roto.addTask('dir-remove', {path: folder_package});
	roto.addTask(function(callback) {
		fs.mkdir(folder_package, function() { callback(); });
	});

	// execute individual sub builds
	roto.addTask(function(callback) {
		var i, n, jobs = [];
		var build = function() {
			if (!jobs.length) return callback();

			var job          = jobs.shift();
			var config_job   = _.extend({}, config, job);
			var filename     = uuid() + '.zxp';

			config_job.debug = false;
			zxps.push(filename);

			roto.executeTask('target:compile', config_job, function(result) {
				if (result === false) {
					return callback(false);
				}

				roto.executeTask('csxs.ucf', {
					input    : folder_build,
					output   : folder_package + '/' + filename,
					keystore : config.certificate.location,
					password : config.certificate.password
				}, function(result) {
					if (result === false) {
						return callback(false);
					}
					build();
				});

			});
		};

		// queue builds & begin
		for (i = 0, n = config.builds.length; i < n; i++) {
			jobs.push(config.builds[i]);
		}
		build();
	});

	// populate project mxi
	roto.addTask(function(callback) {
		var i, j, n, host_key, settings, version_range, filename_zxp;
		var product_versions = {};
		var list_files = [];
		var list_products = [];

		var get_version_range = function(host_key, cs_versions) {
			var result = hosts.getVersionRange(host_key, cs_versions);

			if (!product_versions.hasOwnProperty(host_key)) {
				product_versions[host_key] = {};
			}
			if (!product_versions[host_key].min || parseFloat(result.min) < parseFloat(product_versions[host_key].min)) {
				product_versions[host_key].min = result.min;
			}
			if (!product_versions[host_key].max || parseFloat(result.max) > parseFloat(product_versions[host_key].max)) {
				product_versions[host_key].max = result.max;
			}

			return result;
		};

		// create <files> list
		for (i = 0, n = config.builds.length; i < n; i++) {
			settings = config.builds[i];
			filename_zxp = zxps[i];

			for (j = 0; j < settings['cs-products'].length; j++) {
				host_key = settings['cs-products'][j];
				version_range = get_version_range(host_key, settings['cs-versions']);
				list_files.push('<file destination="" file-type="CSXS" products="' + hosts.getProduct(host_key).familyname + '" maxVersion="' + version_range.max + '" minVersion="' + version_range.min + '" source="' + filename_zxp + '" />');
			}
		}

		// create <product> list
		for (host_key in product_versions) {
			if (product_versions.hasOwnProperty(host_key)) {
				list_products.push('<product familyname="' + hosts.getProduct(host_key).familyname + '" maxversion="' + product_versions[host_key].max + '" primary="true" version="' + product_versions[host_key].min + '" />');
			}
		}

		roto.executeTask('template', {
			files  : 'src/' + config.basename + '.mxi',
			output : './' + config.basename + '.mxi',
			data   : _.extend({}, config, {
				'list-files': list_files.join('\n\t\t'),
				'list-products': list_products.join('\n\t\t')
			})
		}, callback);
	});

	// package hybrid extension
	roto.addTask('csxs.fs_copy', {from: 'assets/icon-mxi.png', to: folder_package + '/icon.png'});
	roto.addTask('csxs.fs_copy', function() {
		return {
			from     : config.basename + '.mxi',
			to       : folder_package + '/' + config.basename + '.mxi'
		};
	});
	roto.addTask('csxs.ucf', function() {
		return {
			input    : folder_package,
			output   : config.filename + '.' + config.version + '.zxp',
			keystore : config.certificate.location,
			password : config.certificate.password
		}
	});
	roto.addTask('csxs.fs_copy', function() {
		return {
			from     : config.filename + '.' + config.version + '.zxp',
			to       : config.basename + '.zxp'
		};
	});

});