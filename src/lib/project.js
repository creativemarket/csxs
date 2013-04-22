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
var path    = require('path');
var project = module.exports = {};

/**
 * Fetches a list of changelog paths,
 * sorted by version (ascending)
 *
 * @returns {array}
 */
project.getChangelogs = function() {
	var files = roto.findFiles('changes/*.txt', 'changes/master.txt');
	files.sort(function(a, b) {
		a = path.basename(a, '.txt');
		b = path.basename(b, '.txt');
		var part_a, part_b;
		var parts_a = a.split('.');
		var parts_b = b.split('.');
		for (var i = 0, n = Math.max(parts_a.length, parts_b.length); i < n; i++) {
			part_a = parseInt(parts_a[i]);
			part_b = parseInt(parts_b[i]);
			if (part_b < part_a) return 1;
			if (part_b > part_a) return -1;
		}
		return 0;
	});

	return files;
};

/**
 * Returns arguments to use with the AXMLC compiler.
 *
 * @param {object} config
 * @param {object} options
 * @returns {array}
 */
project.getCompilerArguments = function(config, options) {
	var i, n, key, value;
	var properties, custom_args;
	var args = [];

	// conditional compiler arguments
	properties = _.extend({
		'debug'   : options.profile === 'debug',
		'release' : options.profile === 'release',
		'version' : config.version
	}, config.properties);

	// custom flags
	custom_args = config['compiler-arguments'];
	if (Array.isArray(custom_args)) {
		for (i = 0, n = custom_args.length; i < n; i++) {
			args.push(custom_args[i]);
		}
	}

	// user defined constants
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

	return args;
};