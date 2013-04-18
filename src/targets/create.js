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

var _        = require('lodash');
var fs       = require('fs');
var async    = require('async');
var path     = require('path');
var optimist = require('optimist');
var prompt   = require('../lib/prompt.js');
var uuid     = require('../lib/uuid.js');


roto.addTarget('create', {
	description: 'Creates a new Creative Suite project in the current directory.'
}, function(options) {

	// check for empty working directory
	roto.addTask(function(callback) {
		var files = fs.readdirSync('.');
		for (var i = 0, n = files.length; i < n; i++) {
			if (path.basename(files[i]).charAt(0) === '.') {
				continue;
			}
			console.error(roto.colorize('ERROR: ', 'red') + 'Working directory must be empty.');
			return callback(false);
		}
		return callback();
	});

	// prompt user for project settings
	var settings_schemas = [
		{
			key: 'name',
			title: 'Project Name',
			description: 'Example: "My Extension"',
			pattern: /^[a-zA-Z0-9\s\-]+$/,
			message: 'Can only contain letters, spaces, or dashes',
			required: true
		},
		{
			key: 'id',
			title: 'Project Identifier (unique)',
			description: 'Example: "MyExtension"',
			pattern: /^[a-zA-Z][\.a-zA-Z]*$/,
			message: 'Can only contain letters, numbers, and periods. Must start with a letter.',
			required: true
		},
		{
			key: 'author',
			title: 'Author Name',
			description: 'Example: "Nikola Tesla"',
			pattern: /^[a-zA-Z0-9\s]+$/,
			message: 'Can only contain letters, numbers, and spaces.',
			required: true
		},
	];

	var settings = {};
	roto.addTask(function(callback) {
		var i = 0;
		var hr = '--------------------------------------------';
		console.log(roto.colorize(hr, 'gray') + '');
		console.log('Please provide the following project properties.\n');

		async.mapSeries(settings_schemas, function(schema, callback) {
			prompt(schema, function(err, value) {
				if (++i < settings_schemas.length) {
					console.log('');
				}
				callback(err, value);
			});
		}, function(err, results) {
			for (var i = 0, n = results.length; i < n; i++) {
				settings[settings_schemas[i].key] = results[i];
			}
			settings.basename = settings.id;
			settings.uuid = uuid();
			settings.year = (new Date).getFullYear();
			console.log(roto.colorize(hr, 'gray'));
			callback();
		});
	});

	roto.addTask(function(callback) {
		console.log('Generating project...');
		callback();
	});

	// copy project template
	roto.addTask('dir-copy', {
		from: path.join(__dirname, '../../project'),
		to: './'
	});

	// fill in templates
	roto.addTask(function(callback) {
		console.log('Populating templates...');
		var files = roto.findFiles([
			'csxs.json',
			'README.md',
			'src/ID.jsx',
			'.actionScriptProperties'
		]);

		var queue = async.queue(function(file, callback) {
			async.auto({
				input: function(callback) {
					fs.readFile(file, 'utf8', callback);
				},
				process: ['input', function(callback, obj) {
					var content = obj.input;
					for (var key in settings) {
						if (settings.hasOwnProperty(key)) {
							var regex = new RegExp('\\{\\{' + key.replace(/\-/g, '\\-') + '\\}\\}', 'g');
							content = content.replace(regex, settings[key]);
						}
					}
					callback(null, content);
				}],
				write: ['process', function(callback, obj) {
					fs.writeFile(file, obj.process, 'utf8', callback);
				}]
			}, callback);
		});

		queue.drain = function(err) { callback(); };
		queue.push(files);
	});

	// rename files
	roto.addTask(function(callback) {
		var files = roto.findFiles('**/ID.*');
		for (var i = 0, n = files.length; i < n; i++) {
			var dir = path.dirname(files[i]);
			var ext = path.extname(files[i]);
			fs.renameSync(files[i], path.join(dir, settings.id + ext));
		}
		callback();
	});

	// finished
	roto.addTask(function(callback) {
		console.log(roto.colorize('Project created.', 'green'));
		callback();
	});

});