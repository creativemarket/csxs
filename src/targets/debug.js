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
var hosts  = require('../lib/hosts.js');


roto.addTarget('debug', {
	description: 'Puts CS into debug mode, installs the extension, and starts logging.'
}, function(options) {
	var ver;
	var ver_max;
	var ver_selected = options['cs-version'];
	var versions = {};
	var build;
	var path_log;
	var path_application;
	var host;
	var folder_apps;
	var folder_home;
	var folder_servicemgr;
	var folder_application;
	var folder_destination;
	var folder_source;

	// load project configuration to `config` global
	roto.addTask('csxs.config_load');

	// find matching build configuration
	roto.addTask(function(callback) {
		var i, n;
		var index_product;
		var index_version;
		var option_product = options['cs-product'];
		var option_version = options['cs-version'];

		if (!options['cs-version'] && !options['cs-product']) {
			build = config.builds[0];
			options['cs-version'] = options['cs-version'] || _.last(build['cs-versions']);
			options['cs-product'] = options['cs-product'] || build['cs-products'][0];
			return callback();
		}

		if (option_version) option_version = parseFloat(option_version).toFixed(1);
		for (i = 0, n = config.builds.length; i < n; i++) {
			index_product = !option_product || config.builds[i]['cs-products'].indexOf(option_product);
			index_version = !option_version || config.builds[i]['cs-versions'].indexOf(option_version);
			if (index_product !== -1 && index_version !== -1) {
				build = config.builds[i];
				if (!option_product) options['cs-product'] = build['cs-products'][0];
				if (!option_version) options['cs-version'] = build['cs-versions'][0];
				return callback();
			}
		}

		console.error(roto.colorize('ERROR: ', 'red') + 'No matching build configuration.');
		return callback(false);
	});

	// validate host information
	roto.addTask(function(callback) {
		try {
			host = hosts.getProduct(options['cs-product'], options['cs-version']);
		} catch (err) {
			console.error(roto.colorize('ERROR: ', 'red') + err.message);
			return callback(false);
		}
		if (!host) {
			console.error(roto.colorize('ERROR: ', 'red') + 'No matching host found.');
			return callback(false);
		}
		callback();
	});

	// detect application version and location
	roto.addTask(function(callback) {
		ver_selected       = String(parseFloat(options['cs-version']));

		folder_apps        = IS_WINDOWS ? 'C:/Program Files' : '/Applications';
		folder_source      = './build/bin-debug';
		folder_application = folder_apps + '/Adobe ' + host.name + ' CS' + ver_selected;
		folder_home        = process.env[IS_WINDOWS ? 'USERPROFILE' : 'HOME'];
		folder_servicemgr  = IS_WINDOWS
			? folder_home  + '/AppData/Roaming/Adobe/CS' + ver_selected + 'ServiceManager/extensions'
			: folder_home  + '/Library/Application Support/Adobe/CS' + ver_selected + 'ServiceManager/extensions';
		folder_destination = folder_servicemgr + '/' + config.id;
		path_log           = IS_WINDOWS
			? folder_home  + '/AppData/Roaming/Macromedia/Flash Player/Logs/flashlog.txt'
			: folder_home  + '/Library/Preferences/Macromedia/Flash Player/Logs/flashlog.txt';

		if (!fs.existsSync(folder_application)) {
			console.error(roto.colorize('ERROR: ', 'red') + 'Unable to find Adobe ' + host.name + ' CS' + ver_selected + '.');
			console.error('"' + folder_application + '"');
			return callback(false);
		}

		path_application = folder_application + '/Adobe ' + host.name + ' CS' + ver_selected + (IS_WINDOWS ? '.exe' : '.app');
		if (!fs.existsSync(path_application)) {
			path_application = folder_application + '/Adobe ' + host.name + (IS_WINDOWS ? '.exe' : '.app')
		}

		callback();
	});

	// compile debug version
	if (options['compile'] !== false) {
		roto.addTask('target:compile', function() {
			var opts = _.extend({debug: true}, build, options);
			return opts;
		});
	}

	// install extension
	roto.addTask('dir-copy', function() {
		return {
			from : folder_source,
			to   : folder_destination
		}
	});

	// enable debug mode + logging
	roto.addTask(function(callback) {
		var path_debug;
		var path_mmcfg;

		// enable application debug mode
		if (host.name === 'Photoshop' || host.name === 'Dreamweaver') {
			path_debug = IS_WINDOWS
				? folder_application + '/debug'
				: path_application + '/Contents/debug';

			console.log(roto.colorize('touch "' + path_debug, 'magenta') + '"');
			fs.writeFileSync(path_debug, '', 'utf8');
		}

		// enable flash player logging
		try {
			path_mmcfg = IS_WINDOWS ? folder_home + '/mm.cfg' : '/Library/Application Support/Macromedia/mm.cfg';
			console.log('Creating "' + path_mmcfg + '"...');
			fs.writeFileSync(path_mmcfg, [
				'ErrorReportingEnable=1',
				'TraceOutputFileEnable=1'
			].join('\n'), 'utf8');
		} catch (e) {
			console.log(roto.colorize('WARNING: Unable to write "mm.cfg". If debugging doesn\'t work, run with sudo.', 'yellow'));
		}

		// create empty log
		console.log('Empty log file at "' + path_log + '"...');
		roto.writeFile(path_log, '', 'utf8');

		callback();
	});

	// set "PlayerDebugMode" flag in plist
	roto.addTask(function(callback) {
		var args, defaults;
		var PLISTS = {
			'5'   : folder_home + '/Library/Preferences/com.adobe.CSXS2Preferences.plist',
			'5.5' : folder_home + '/Library/Preferences/com.adobe.CSXS.2.5.plist',
			'6'   : folder_home + '/Library/Preferences/com.adobe.CSXS.3.plist'
		};

		if (!IS_MAC) return callback();
		if (!PLISTS.hasOwnProperty(ver_selected)) return callback();

		args = ['write', PLISTS[ver_selected], 'PlayerDebugMode', '1'];
		console.log(roto.colorize('defaults ' + args.join(' '), 'magenta'));

		defaults = spawn('defaults', args);
		defaults.stdout.on('data', function (data) { process.stdout.write(data); });
		defaults.stderr.on('data', function (data) { process.stderr.write(data); });
		defaults.on('exit', function(code) { callback(); });
	});

	// launch application
	if (options.launch) {
		roto.addTask(function(callback) {
			if (IS_WINDOWS) return callback();
			var cmd_kill = 'kill -9 `ps -ef | grep "Adobe ' + host.name + ' CS" | grep -v grep | awk \'{print $2}\'`';
			console.log(roto.colorize(cmd_kill, 'magenta'));
			exec(cmd_kill, function(err, stdout, stderr) {
				callback();
			});
		});
		roto.addTask(function(callback) {
			var application;
			var path_start = IS_WINDOWS ? 'start' : 'open';


			console.log(roto.colorize(path_start + ' "' + path_application + '"', 'magenta'));

			application = IS_WINDOWS
				? spawn(path_start, [path_application])
				: spawn(path_start, ['-F', '-n', path_application]);
			application.stdout.on('data', function (data) { process.stdout.write(data); });
			application.stderr.on('data', function (data) { process.stderr.write(data); });
			application.on('exit', function(code) {
				callback();
			});
		});
	}

	// start flash debugger
	if (options.fdb) {
		roto.addTask('csxs.fdb', function() {
			return {ver_flex: options['flex-version'] || config['flex-version']};
		});
	} else {
		roto.addTask(function(callback) {
			var tail, args;

			console.log(roto.colorize('tail -f "' + path_log + '"', 'magenta'));
			tail = spawn('tail', ['-f', path_log]);
			tail.stdout.on('data', function (data) { process.stdout.write(data); });
			tail.stderr.on('data', function (data) { process.stderr.write(data); });
			tail.on('exit', function(code) { callback(); });
		});
	}

});