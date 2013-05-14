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
var git   = require('../lib/git.js');


roto.defineTask('csxs.git_tag', function(callback, options) {
	git.status(function(status) {
		if (!status) return callback();

		var args = ['tag', '--force', options.name];
		console.log(roto.colorize('git ' + args.join(' '), 'magenta'));
		var git = spawn('git', args);
		git.on('exit', function(code) { callback(); });
	});
});


roto.defineTask('csxs.git_push_tags', function(callback) {
	git.status(function(status) {
		if (!status) return callback();

		var args = ['push', 'origin', '--tags'];
		console.log(roto.colorize('git ' + args.join(' '), 'magenta'));
		var git = spawn('git', args);
		git.on('exit', function(code) { callback(); });
	});
});


roto.defineTask('csxs.git_is_clean', function(callback) {
	git.status(function(status) {
		if (!status || status.clean) {
			callback();
		} else {
			roto.error(roto.colorize('ERROR:', 'red') + ' You must commit modified files before issuing a public release.\n');
			callback(false);
		}
	});
});