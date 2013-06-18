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

var _       = require('lodash');
var fs      = require('fs');
var path    = require('path');
var spawn   = require('child_process').spawn;
var project = require('../lib/project.js');
var hosts   = require('../lib/hosts.js');

/**
 * Options:
 * - input
 * - output
 * - cs-products
 * - cs-versions
 */

roto.defineTask('csxs.amxmlc_manifest', function(callback, options) {
	var i, j, k, n, range, ranges, host, host_id;
	var list_hosts = [];

	// creative suite apps
	var config_cs_products = options['cs-products'];
	var config_cs_versions = options['cs-versions'];
	if (config_cs_products) {
		for (i = 0, n = config_cs_products.length; i < n; i++) {
			host  = hosts.getProduct(config_cs_products[i]);
			range = hosts.getVersionRange(config_cs_products[i], config_cs_versions);
			for (j = 0; j < host.ids.length; j++) {
				list_hosts.push('<Host Name="' + host.ids[j] + '" Version="[' + range.min + ',' + range.max + ']" />');
			}
		}
	}

	// creative cloud apps
	var config_cc_products = options['cc-products'];
	if (config_cc_products) {
		for (host_id in config_cc_products) {
			if (!config_cc_products.hasOwnProperty(host_id)) {
				continue;
			}
			host = hosts.getProduct(host_id);
			ranges = config_cc_products[host_id];
			for (j = 0; j < host.ids.length; j++) {
				for (k = 0; k < ranges.length; k++) {
					list_hosts.push('<Host Name="' + host.ids[j] + '" Version="[' + ranges[k].min + ',' + ranges[k].max + ']" />');
				}
			}
		}
	}

	roto.executeTask('template', {
		files  : path.relative(process.cwd(), options.input),
		output : options.output,
		data   : _.extend({}, config, {
			'list-hosts': list_hosts.join('\n\t\t\t')
		})
	}, callback);
});

/**
 * Options:
 * - profile
 * - ver_flex
 * - path_output
 * - path_src
 * - path_mxml
 * - path_amxmlc
 */

roto.defineTask('csxs.amxmlc', function(callback, options) {
	var args, args_extra, amxmlc, beautify, i, n;

	beautify = function(str) {
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

	// base compiler args
	args = [
		'-verify-digests',
		'-warnings=true',
		'-use-network=true',
		'-compiler.strict=true',
		'-compiler.show-binding-warnings=true',
		'-compiler.show-deprecation-warnings=true',
		'-compiler.debug=' + String(options.profile === 'debug'),
		'-locale=en_US',
		'-output=' + options.path_output,
		'-library-path+=' + config.flex[options.ver_flex].join(',')
	];

	// extended arguments
	args_extra = project.getCompilerArguments(config, options);
	for (i = 0, n = args_extra.length; i < n; i++) {
		args.push(args_extra[i]);
	}

	args.push('--source-path');
	args.push(options.path_src);
	args.push('--');
	args.push(options.path_mxml);

	// execute compiler
	console.log(roto.colorize('amxmlc ' + args.join(' '), 'magenta'));
	amxmlc = spawn(options.path_amxmlc, args);
	amxmlc.stdout.on('data', function (data) { console.log(beautify(data)); });
	amxmlc.stderr.on('data', function (data) { console.error(beautify(data)); });
	amxmlc.on('exit', function(code) {
		if (code !== 0) {
			console.error(roto.colorize('"' + options.path_output + '"', '') + ' [' + roto.colorize('fail', 'red') + ']');
			return callback(false);
		}
		console.log(roto.colorize('"' + options.path_output + '"', '') + ' [' + roto.colorize('success', 'green') + ']');
		return callback();
	});
});