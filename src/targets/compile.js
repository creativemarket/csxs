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
var hosts   = require('../lib/hosts.js');


roto.addTarget('compile', {
	description: 'Compiles SWF, ready for packaging / testing.', hidden: true
}, function(options) {

	var profile = options.debug !== false ? 'debug' : 'release';
	var ver_flex;
	var folder_cssdk;
	var folder_flex;
	var folder_src = './src';
	var folder_build = './build/bin-' + profile;
	var bin_amxmlc;
	var paths_mxml;
	var path_amxmlc;
	var path_manifest;

	// find all *.mxml files
	paths_mxml = roto.findFiles(folder_src + '/*.mxml');
	if (!paths_mxml || !paths_mxml.length) {
		console.error(roto.colorize('ERROR: ', 'red') + 'No *.mxml files found in "src".');
		return false;
	}

	// load project configuration to `config` global
	roto.addTask('csxs.config_load');

	// configure environment
	roto.addTask('target:configure', options);

	// compilation settings
	roto.addTask(function(callback) {
		ver_flex      = options['flex-version'] || config['flex-version'];
		folder_cssdk  = process.env.CSSDK;
		folder_flex   = folder_cssdk + '/CS Flex SDK ' + ver_flex;
		bin_amxmlc    = IS_WINDOWS ? 'amxmlc.exe' : 'amxmlc';
		path_amxmlc   = path.normalize(folder_flex + '/bin/' + bin_amxmlc);
		path_manifest = path.resolve('./src', options['manifest']);

		callback();
	});

	// validate manifest
	roto.addTask(function(callback) {
		if (!fs.existsSync(path_manifest)) {
			console.error(roto.colorize('ERROR: ', 'red') + 'Unable to read "' + path_manifest + '".');
			return callback(false);
		}
		callback();
	});

	// resolve swc library paths
	roto.addTask(function(callback) {
		console.log('Resolving SWC dependencies...');
		if (!config.flex.hasOwnProperty(ver_flex)) {
			console.error(roto.colorize('ERROR: ', 'red') + 'Invalid Flex version number "' + ver_flex + '".');
			return callback(false);
		}

		var libs = config.flex[ver_flex];
		for (var i = 0, n = libs.length; i < n; i++) {
			libs[i] = libs[i].replace(/\$\{([a-zA-Z_]+)\}/g, function() {
				var var_name  = arguments[1];
				var var_value = process.env[var_name] || '';
				return path.normalize(var_value).replace(/\/$/, '');
			});
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
			console.error(roto.colorize('ERROR: ', 'red') + 'Unable to find Adobe Application Compiler at:');
			console.error('"' + path_amxmlc + '"');
			return callback(false);
		}

		callback();
	});

	// prepare build directory
	roto.addTask('dir-remove', {path: folder_build});
	roto.addTask('dir-copy', {from: './assets', to: folder_build + '/assets'});
	roto.addTask('csxs.amxmlc_manifest', function() {
		return _.extend({}, options, {
			input: path_manifest,
			output: folder_build + '/CSXS/manifest.xml',
		});
	});

	// copy jsx scripts
	roto.addTask('csxs.fs_copy', function(callback) {
		console.log('Copying *.jsx scripts... ');
		return {
			from : folder_src + '/' + config.basename + '.jsx',
			to   : folder_build + '/' + config.basename + '.jsx'
		};
	});

	// compile all mxml files
	var compile_mxml = function(path_mxml) {
		roto.addTask('csxs.amxmlc', function() {
			return {
				profile     : profile,
				ver_flex    : ver_flex,
				path_src    : folder_src,
				path_amxmlc : path_amxmlc,
				path_mxml   : path_mxml,
				path_output : folder_build + '/' + path.basename(path_mxml, '.mxml') + '.swf'
			};
		});
	};

	for (var i = 0, n = paths_mxml.length; i < n; i++) {
		compile_mxml(paths_mxml[i]);
	}

});