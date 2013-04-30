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


roto.addTarget('configure', {
	description: 'Configures build environment (Determines CS and Flex SDK locations).'
}, function(options) {

	// load project configuration to `config` global
	roto.addTask('csxs.config_load');
	roto.addTask(function(callback) {
		if (options.debug !== false) {
			config.id   += '.debug';
			config.name += ' (debug)';
		}
		callback();
	});

	// check for creative suite sdk
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

	// generate configuration for flash builder
	roto.addTask(function(callback) {
		if (fs.existsSync('./src/' + config.basename + '.jsx')) {
			roto.executeTask('csxs.fs_symlink', {
				from: './src/' + config.basename + '.jsx',
				to: './' + config.basename + '.jsx'
			}, callback);
		} else {
			callback();
		}
	});

	roto.addTask('csxs.fs_copy', {
		from : path.resolve(__dirname, '../../project/.actionScriptProperties'),
		to   : './.actionScriptProperties'
	});

	roto.addTask('template', function() {
		var build         = config.builds[0];
		var flex_version  = build['flex-version'] || config['flex-version'];
		var libraries     = config.flex[flex_version];
		var libraries_xml = [];

		for (var i = 0, n = libraries.length; i < n; i++) {
			libraries_xml.push('<libraryPathEntry kind="3" linkType="1" path="' + libraries[i] + '" useDefaultLinkType="false" />');
		}

		return {
			files : '.actionScriptProperties',
			data  : _.extend({}, config, {
				'compiler-arguments': project.getCompilerArguments(config, options).join(' '),
				'libraries': libraries_xml.join('\n\t\t\t')
			})
		};
	});

	roto.addTask('csxs.amxmlc_manifest', function() {
		return _.extend({}, config.builds[0], {
			input: 'src/manifest.cs6.xml',
			output: '.staged-extension/CSXS/manifest.xml'
		});
	});

});