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

var fs         = require('fs');
var jsmin      = require('jsmin').jsmin;
var jsonschema = require('jsonschema');
var schema     = require('../../schema.json');
var validator  = new jsonschema.Validator();

if (schema.definitions) {
	for (var key in schema.definitions) {
		if (schema.definitions.hasOwnProperty(key)) {
			validator.addSchema(schema.definitions[key], '/definitions/' + key);
		}
	}
}

delete schema.definitions;

roto.defineTask('csxs.config_load', function(callback){
	var path = process.cwd() + '/csxs.json';

	/**
	 * Reads and parses "csxs.json".
	 *
	 * @param {function} callback
	 */
	var read = function(callback) {
		var data;
		if (!fs.existsSync(path)) return callback('File not found.');
		try { data = JSON.parse(jsmin(fs.readFileSync(path, 'utf8'))); }
		catch (e) { console.dir(e.toString()); return callback('Unable to parse JSON.'); }

		data.basename = data.basename || data.id;
		data.filename = data.filename || data.basename;
		callback(null, data);
	};

	/**
	 * Validates configuration.
	 *
	 * @param {object} data
	 * @returns {object}
	 */
	var validate = function(data, callback) {
		if (!data) return 'Configuration empty (csxs.json).';
		process.stdout.write('Validating csxs.json...');

		var message, i, n;
		var result = validator.validate(data, schema);
		var err = result.errors;

		if (err.length) process.stdout.write('\n');
		for (i = 0, n = err.length; i < n; i++) {
			if (err[i].validator === 'definitions') continue;

			if (err[i].schema.description) {
				message = '"' + err[i].property + '" ' + err[i].schema.description;
			} else {
				message = err[i].stack;
			}

			message = message.replace('instance.', '');
			console.error(roto.colorize('ERROR: ', 'red') + message);
		}

		if (!err.length) {
			console.log(' [' + roto.colorize('success', 'green') + ']');
		}
		return !err.length;
	};

	if (config) return callback();
	console.log('Reading project configuration...');
	read(function(err, data) {
		if (err) {
			console.error(roto.colorize('ERROR: ', 'red') + 'Unable to read "csxs.json" at project root (' + err + ').');
			return callback(false);
		}
		if (!validate(data)) {
			return callback(false);
		} else {
			config = data;
			callback();
		}
	});
});