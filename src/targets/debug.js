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


roto.addTarget('debug', {
	description: 'Puts PS into debug mode, installs the extension, and starts FDB.'
}, function(options) {
	var ver;
	var ver_max;
	var ver_selected = options['cs-version'];
	var versions = {};
	var path_log;
	var folder_apps;
	var folder_home;
	var folder_servicemgr;
	var folder_photoshop;
	var folder_destination;
	var folder_source;

	// load project configuration to `config` global
	roto.addTask('csxs.config_load');

	// detect photoshop versions and location
	roto.addTask(function(callback) {

		folder_apps   = IS_WINDOWS ? 'C:/Program Files' : '/Applications';
		folder_source = './build/bin-debug';

		// detect all available versions
		fs.readdirSync(folder_apps).forEach(function(folder) {
			var match = folder.match(/^Adobe Photoshop CS(\d+(\.\d+)?)$/);
			if (match) versions[match[1]] = folder_apps + '/' + match[0];
		});

		// check for requested version, or pick newest if not specified
		if (ver_selected) {
			if (!versions.hasOwnProperty(ver_selected)) {
				console.error(roto.colorize('ERROR: ', 'red') + 'Unable to find Adobe Photoshop CS' + ver_selected + '.');
				return callback(false);
			}
		} else {
			for (ver in versions) {
				if (versions.hasOwnProperty(ver) && (!ver_max || parseFloat(ver) > ver_max)) {
					ver_max = ver;
				}
			}
			if (!ver_max) {
				console.error(roto.colorize('ERROR: ', 'red') + 'Unable to find an installation of Adobe Photoshop.');
				return callback(false);
			}
			ver_selected = ver_max;
		}

		// resolve paths
		folder_home        = process.env[IS_WINDOWS ? 'USERPROFILE' : 'HOME'];
		folder_photoshop   = versions[ver_selected];
		folder_servicemgr  = IS_WINDOWS
			? folder_home + '/AppData/Roaming/Adobe/CS' + ver_selected + 'ServiceManager/extensions'
			: folder_home + '/Library/Application Support/Adobe/CS' + ver_selected + 'ServiceManager/extensions';
		folder_destination = folder_servicemgr + '/' + config.id;
		path_log           = IS_WINDOWS
			? folder_home + '/AppData/Roaming/Macromedia/Flash Player/Logs/flashlog.txt'
			: folder_home + '/Library/Preferences/Macromedia/Flash Player/Logs/flashlog.txt';

		callback();
	});

	// compile debug version
	if (options['compile'] !== false) {
		roto.addTask('target:compile', {debug: true});
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

		// enable photoshop debug mode
		var path_debug = folder_photoshop + '/' + (IS_WINDOWS ? 'debug' : 'Adobe Photoshop CS' + ver_selected + '.app/Contents/debug');
		console.log(roto.colorize('touch "' + path_debug, 'magenta') + '"');
		fs.writeFileSync(path_debug, '', 'utf8');

		// enable flash player logging
		var path_mmcfg = IS_WINDOWS
			? folder_home + '/mm.cfg'
			: '/Library/Application Support/Macromedia/mm.cfg';

		console.log('Creating "' + path_mmcfg + '"...');
		fs.writeFileSync(path_mmcfg, [
			'ErrorReportingEnable=1',
			'TraceOutputFileEnable=1'
		].join('\n'), 'utf8');

		// create empty log
		console.log('Empty log file at "' + path_log + '"...');
		roto.writeFile(path_log, '', 'utf8');

		callback();
	});

	// launch photoshop
	if (options.launch) {
		roto.addTask(function(callback) {
			if (IS_WINDOWS) return callback();
			var cmd_kill = 'kill -9 `ps -ef | grep "Adobe Photoshop CS" | grep -v grep | awk \'{print $2}\'`';
			console.log(roto.colorize(cmd_kill, 'magenta'));
			exec(cmd_kill, function(err, stdout, stderr) {
				callback();
			});
		});
		roto.addTask(function(callback) {
			var photoshop;
			var path_start = IS_WINDOWS ? 'start' : 'open';
			var path_photoshop = folder_photoshop + '/Adobe Photoshop CS' + ver_selected + (IS_WINDOWS ? '.exe' : '.app');

			console.log(roto.colorize(path_start + ' "' + path_photoshop + '"', 'magenta'));

			photoshop = IS_WINDOWS
				? spawn(path_start, [path_photoshop])
				: spawn(path_start, ['-F', '-n', path_photoshop]);
			photoshop.stdout.on('data', function (data) { console.log(data); });
			photoshop.stderr.on('data', function (data) { console.error(data); });
			photoshop.on('exit', function(code) {
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