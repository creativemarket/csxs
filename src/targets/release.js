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
var http   = require('http');
var git    = require('../lib/git.js');

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

module.exports = function(roto) {
	roto.addTarget('release', {
		description: 'Builds, signs, and uploads the *.zxp installer.'
	}, function(options) {
		var bucket             = pkg.s3.bucket;
		var file_zxp_versioned = 'ID.' + config.version + '.zxp';
		var file_zxp           = 'ID.zxp';
		var url_zxp            = 'http://' + pkg.s3.bucket + '/releases/' + file_zxp_versioned;
		var path_changelog     = 'changelogs/' + config.version + '.txt';
		var changes            = '';

		// read changelog file
		try {
			changes = fs.readFileSync(path_changelog, 'utf8');
		} catch (e) {
			console.error(roto.colorize('ERROR: ', 'red') + '"' + path_changelog + '" must exist.');
			return false;
		}

		// assemble update.xml description
		var version;
		var changes_html = '<dl>';
		var changelogs = getChangelogs();
		for (var i = changelogs.length - 1, i0 = Math.max(0, i - 2); i >= i0; i--) {
			version = 'v' + path.basename(changelogs[i], '.txt');
			changes_html += '<dt><b>' + version + '</b></dt>';
			changes_html += '<dd>' + fs.readFileSync(changelogs[i], 'utf8').replace(/\r?\n/g, '<br>') + '</dd>';
		}
		changes_html += '</dl>';

		// generate new master changelog files
		roto.addTask('target:changelogs');

		// check to see if this version has already been released
		roto.addTask(function(callback) {
			http.request({
				hostname: pkg.s3.bucket,
				port: 80,
				path: '/releases/' + file_zxp_versioned,
				method: 'HEAD'
			}, function(res) {
				if (res.statusCode === 200) {
					if (options.force) {
						console.error(roto.colorize('WARNING:', 'yellow') + ' v' + config.version + ' has already been released.');
						callback();
					} else {
						console.error(roto.colorize('ERROR:', 'red') + ' v' + config.version + ' has already been released. Run with --force to ignore.');
						callback(false);
					}
				} else {
					callback();
				}
			}).end();
		});

		// check for clean working directory
		roto.addTask(function(callback) {
			git.status(function(status) {
				if (status.clean) {
					callback();
				} else {
					roto.error(roto.colorize('ERROR:', 'red') + ' You must commit modified files before issuing a public release.\n');
					callback(false);
				}
			});
		});

		// build fresh copy
		roto.addTask('target:package');

		// create staged files
		roto.addTask('dir-remove', {path: 'temp'});
		roto.addTask('dir-copy', {from: 'changelogs', to: 'temp/changelogs'});
		roto.addTask(function(callback) {
			copySync(file_zxp_versioned, 'temp/' + file_zxp, 'binary');
			callback();
		});
		roto.addTask(function(callback) {
			copySync(file_zxp_versioned, 'temp/' + file_zxp_versioned, 'binary');
			callback();
		});

		// update.json
		roto.addTask(function(callback) {
			var info = {
				version: config.version,
				description: changes,
				url: url_zxp
			};

			roto.writeFile('temp/update.json', JSON.stringify(info), 'utf8');
			callback();
		});

		// update.xml
		roto.addTask('template', {
			files  : 'src/update.xml',
			output : 'temp/update.xml',
			data   : {
				version: config.version,
				description: changes_html,
				url: url_zxp
			}
		});

		// sync to s3
		roto.addTask('s3', {
			key: pkg.s3.key,
			secret: pkg.s3.secret,
			bucket: bucket,
			folder: 'temp',
			destination: 'releases',
			ttl: 0
		});

		// create git tag
		roto.addTask(function(callback) {
			var args = ['tag', '--force', 'v' + config.version];
			console.log(roto.colorize('git ' + args.join(' '), 'magenta'));
			var git = spawn('git', args);
			git.on('exit', function(code) { callback(); });
		});
		roto.addTask(function(callback) {
			var args = ['push', 'origin', '--tags'];
			console.log(roto.colorize('git ' + args.join(' '), 'magenta'));
			var git = spawn('git', args);
			git.on('exit', function(code) { callback(); });
		});

		// completion
		roto.addTask('dir-remove', {path: 'temp'});
		roto.addTask(function(callback) {
			console.log(roto.colorize('v' + config.version + ' successfully released.', 'green'));
			callback();
		});

	});
};