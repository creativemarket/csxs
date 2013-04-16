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

var fs    = require('fs');
var path  = require('path');
var spawn = require('child_process').spawn;

/**
 * Options:
 * - ver_flex
 */

roto.defineTask('csxs.fdb', function(callback, options) {
	var fdb, paused, running, args;
	var ver_flex     = options.ver_flex;
	var folder_flex  = process.env.CSSDK + '/CS Flex SDK ' + ver_flex;
	var path_fdb     = path.normalize(folder_flex + '/lib/fdb.jar');

	if (!fs.existsSync(path_fdb)) {
		console.error(roto.colorize('ERROR: ', 'red') + 'Unable to find "' + path_fdb + '".');
		return callback(false);
	}

	paused = false;
	running = false;
	args = ['-jar', '-Dtrace.error=true', path_fdb];
	console.log(roto.colorize('java ' + args.join(' '), 'magenta'));

	fdb = spawn('java', args);
	fdb.stdout.on('data', function (data) {
		if (/type 'continue'/.test(data)) {
			paused = true;
		}
		if (/\(fdb\)/.test(data)) {
			if (running && paused) {
				console.log(roto.colorize('(fdb) continue', 'gray'));
				fdb.stdin.write('continue\n');
				paused = false;
			} else if (!running) {
				console.log(roto.colorize('(fdb) run', 'gray'));
				fdb.stdin.write('run\n');
				running = true;
			}
		} else {
			console.log(data);
		}
	});

	fdb.stderr.on('data', function (data) {
		console.error(data);
	});

	fdb.on('exit', function(code) {
		callback();
	});
});