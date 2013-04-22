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

var fs = require('fs');
var spawn = require('child_process').spawn;

var task_symlink = function(callback, options) {
	var args = ['-s', options.from, options.to];
	console.log(roto.colorize('ln ' + args.join(' '), 'magenta'));
	var ln = spawn('ln', args);
	ln.on('exit', function() { callback(); });
};

var task_copy = function(callback, options) {
	if (!fs.existsSync(options.from)) {
		console.error(roto.colorize('ERROR: ', 'red') + 'File not found "' + options.from + '".');
		return callback(false);
	}
	var content = fs.readFileSync(options.from, 'binary');
	fs.writeFileSync(options.to, content, 'binary');
	callback();
};

roto.defineTask('csxs.fs_copy', task_copy);
roto.defineTask('csxs.fs_symlink', IS_WINDOWS ? task_copy : task_symlink);