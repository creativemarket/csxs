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

var spawn = require('child_process').spawn;
var git = module.exports = {};

/**
 * Determines the current `git status` of the working
 * directory. Provides the callback with an object containing:
 *
 * - clean (boolean)
 * - branch (string)
 *
 * @param {function} callback
 */
git.status = function(callback) {
	var result = null;

	var proc = spawn('git', ['status']);
	proc.stdout.on('data', function(data) {
		result = result || {
			clean: false,
			branch : null
		};

		// parse branch information
		var branch = str.match(/On branch ([^\n]+)/);
		result.branch = branch && branch[1].replace(/^\s+|\s+$/, '');

		// parse working directory status
		if (str.indexOf('working directory clean') !== -1) {
			result.clean = true;
		}
	});

	proc.on('exit', function() {
		callback(result);
	});
};