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

var _     = require('lodash');
var fs    = require('fs');
var spawn = require('child_process').spawn;

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
	var beautify = function(str) {
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
	var args = [
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

	// conditional compiler args
	var properties = _.extend({
		'debug'   : options.profile === 'debug',
		'release' : options.profile === 'release',
		'version' : config.version
	}, config.properties);

	// user defined constants
	var key, value;
	for (key in properties) {
		value = properties[key];
		if (value && typeof value === 'object') {
			value = value[options.profile];
		}
		if (properties.hasOwnProperty(key) && ((typeof value !== 'object' && typeof value !== 'array') || properties[key] === null)) {
			args.push('-define=CONFIG::' + key + ',' + JSON.stringify(value));
		}
	}

	if (parseInt(options.ver_flex, 10) >= 4) {
		args.push('-includes=mx.managers.systemClasses.MarshallingSupport');
	}

	args.push('--source-path');
	args.push(options.path_src);
	args.push('--');
	args.push(options.path_mxml);

	// execute compiler
	console.log(roto.colorize('amxmlc ' + args.join(' '), 'magenta'));
	var amxmlc = spawn(options.path_amxmlc, args);
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