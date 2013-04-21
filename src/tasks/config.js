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

	var read = function(callback) {
		var data;
		if (!fs.existsSync(path)) return callback('File not found.');
		try { data = JSON.parse(jsmin(fs.readFileSync(path, 'utf8'))); }
		catch (e) { console.dir(e.toString()); return callback('Unable to parse JSON.'); }

		data.basename = data.basename || data.id;
		callback(null, data);
	};

	if (config) return callback();
	read(function(err, data) {
		if (err) {
			console.error(roto.colorize('ERROR: ', 'red') + 'Unable to read "csxs.json" at project root (' + err + ').');
			return callback(false);
		}
		config = data;
		callback();
	});
});