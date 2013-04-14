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
var project = require('../lib/project.js');

module.exports = function(roto) {
	roto.addTarget('changelogs', {
		description: 'Builds new master changelogs.'
	}, function(options) {
		var files;

		roto.addTask(function(callback) {
			files = project.getChangelogs();
			callback();
		});

		// generate changelogs/master.txt
		roto.addTask(function(callback) {
			var ver, txt = '';
			for (var i = 0, n = files.length; i < n; i++) {
				ver = 'v' + path.basename(files[i], '.txt');
				txt += ver + '\n';
				txt += fs.readFileSync(files[i], 'utf8').replace(/^\s+|\s+$/g, '');
				txt += '\n\n';
			}
			txt = txt.replace(/\s+$/, '') + '\n';
			roto.writeFile('changes/master.txt', txt, 'utf8');
			console.log('changes/master.txt written.');
			callback();
		});

		// generate HISTORY.md
		roto.addTask(function(callback) {
			var ver, txt;
			var rows = [];
			for (var i = 0, n = files.length; i < n; i++) {
				ver = 'v' + path.basename(files[i], '.txt');
				rows.push('<tr><td><strong>' + ver + '</strong></td><td>' + fs.readFileSync(files[i], 'utf8').replace(/^\s+|\s+$/g, '').replace(/\r?\n/g, '<br>') + '</td></tr>');
			}
			txt = '# Version History\n\n<table width="100%">\n' + rows.join('\n') + '\n</table>\n';
			roto.writeFile('HISTORY.md', txt, 'utf8');
			console.log('HISTORY.md written.');
			callback();
		});

	});
};