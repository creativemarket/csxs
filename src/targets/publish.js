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

var fs      = require('fs');
var path    = require('path');
var spawn   = require('child_process').spawn;
var exec    = require('child_process').exec;
var http    = require('http');
var git     = require('../lib/git.js');
var project = require('../lib/project.js');


roto.addTarget('publish', {
	description: 'Builds, signs, and uploads a *.zxp installer + update info to S3.'
}, function(options) {

	var changes;
	var changes_html;
	var file_zxp_versioned;
	var file_zxp;
	var url_zxp;
	var path_s3;
	var path_changelog;

	// load project configuration to `config` global
	roto.addTask('csxs.config_load');

	// validate settings
	roto.addTask(function(callback) {
		var err;
		if (!config.s3) err = 'Amazon S3 not configured.';
		else if (!config.s3.bucket) err = 'Amazon S3 bucket not provided.';
		else if (!config.s3.key) err = 'Amazon S3 access key not provided.';
		else if (!config.s3.secret) err = 'Amazon S3 access secret not provided.';

		if (err) {
			console.error(roto.colorize('ERROR: ', 'red') + err);
			console.error('       ' + roto.colorize('https://github.com/creativemarket/csxs/blob/master/docs/configuration.md#s3', 'underline'));
			return callback(false);
		}

		callback();
	});

	// deploy settings
	roto.addTask(function(callback) {
		file_zxp_versioned = config.basename + '.' + config.version + '.zxp';
		file_zxp           = config.basename + '.zxp';
		path_changelog     = 'changes/' + config.version + '.txt';
		path_s3            = config.s3.path || '/';
		changes            = '';

		if (path_s3.charAt(path_s3.length - 1) !== '/') path_s3 += '/';
		path_s3 = path_s3.replace(/^\/+/, '');

		url_zxp = 'http://' + config.s3.bucket + '/' + path_s3 + file_zxp_versioned;
		callback();
	});

	// read changes
	roto.addTask(function(callback) {
		try {
			changes = fs.readFileSync(path_changelog, 'utf8');
		} catch (e) {
			console.error(roto.colorize('ERROR: ', 'red') + '"' + path_changelog + '" must exist.');
			return callback(false);
		}
		callback();
	});

	// build "update.xml" description (html)
	roto.addTask(function(callback) {
		var version;
		var changelogs = project.getChangelogs();
		changes_html = '<dl>';

		for (var i = changelogs.length - 1, i0 = Math.max(0, i - 2); i >= i0; i--) {
			version = 'v' + path.basename(changelogs[i], '.txt');
			changes_html += '<dt><b>' + version + '</b></dt>';
			changes_html += '<dd>' + fs.readFileSync(changelogs[i], 'utf8').replace(/\r?\n/g, '<br>') + '</dd>';
		}
		changes_html += '</dl>';
		callback();
	});

	// generate new master changelog files
	roto.addTask('target:changelogs');

	// check to see if this version has already been released
	roto.addTask(function(callback) {
		http.request({
			hostname : config.s3.bucket,
			port     : 80,
			path     : '/releases/' + file_zxp_versioned,
			method   : 'HEAD'
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
	roto.addTask('csxs.git_is_clean');

	// build fresh copy
	roto.addTask('target:package');

	// create staged files
	roto.addTask('dir-remove', {path: 'temp'});
	roto.addTask('dir-copy', {from: 'changes', to: 'temp/changes'});
	roto.addTask('csxs.fs_copy', function() {
		return {from: file_zxp_versioned, to: 'temp/' + file_zxp};
	});
	roto.addTask('csxs.fs_copy', function() {
		return {from: file_zxp_versioned, to: 'temp/' + file_zxp_versioned};
	});

	// update.json
	roto.addTask(function(callback) {
		var info = {
			'version': config.version,
			'description': changes,
			'url': url_zxp
		};

		roto.writeFile('temp/update.json', JSON.stringify(info), 'utf8');
		callback();
	});

	// update.xml
	roto.addTask('template', function() {
		return {
			files   : 'src/update.xml',
			output  : 'temp/update.xml',
			data    : {
				version: config.version,
				description: changes_html,
				url: url_zxp
			}
		};
	});

	// sync to s3
	roto.addTask('s3', function() {
		return {
			key         : config.s3.key,
			secret      : config.s3.secret,
			bucket      : config.s3.bucket,
			folder      : 'temp',
			destination : path_s3,
			ttl         : 0
		};
	});

	// create git tag
	roto.addTask('csxs.git_tag', function() { return {name: 'v' + config.version}; });
	roto.addTask('csxs.git_push_tags');

	// completion
	roto.addTask('dir-remove', {path: 'temp'});
	roto.addTask(function(callback) {
		console.log(roto.colorize('v' + config.version + ' successfully released.', 'green'));
		callback();
	});

});