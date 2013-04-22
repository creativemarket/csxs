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
var jsmin  = require('jsmin').jsmin;


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
		callback(null, data);
	};

	/**
	 * Validates configuration.
	 *
	 * @param {function} callback
	 */
	var validate = function(data) {
		if (!data) return 'Configuration empty (csxs.json).';

		// TODO: validate via json schema
		var required = ['version','id','name','author','icons','size','flex-version','flex','builds'];
		for (var i = 0, n = required.length; i < n; i++) {
			if (!data.hasOwnProperty(required[i])) {
				return 'No "' + required[i] + '" property found in csxs.json.';
			}
		}
	};

	if (config) return callback();
	read(function(err, data) {
		if (err) {
			console.error(roto.colorize('ERROR: ', 'red') + 'Unable to read "csxs.json" at project root (' + err + ').');
			return callback(false);
		}
		err = validate(data);
		if (err) {
			console.error(roto.colorize('ERROR: ', 'red') + err);
			return callback(false);
		}
		config = data;
		callback();
	});
});