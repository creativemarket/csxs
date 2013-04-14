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

var fs   = require('fs');
var path = require('path');


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

});