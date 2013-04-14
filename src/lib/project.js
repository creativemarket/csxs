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

var path = require('path');
var project = module.exports = {};

/**
 * Fetches a list of changelog paths,
 * sorted by version (ascending)
 *
 * @returns {array}
 */
project.getChangelogs = function() {
	var files = roto.findFiles('changes/*.txt', 'changes/master.txt');
	files.sort(function(a, b) {
		a = path.basename(a, '.txt');
		b = path.basename(b, '.txt');
		var part_a, part_b;
		var parts_a = a.split('.');
		var parts_b = b.split('.');
		for (var i = 0, n = Math.max(parts_a.length, parts_b.length); i < n; i++) {
			part_a = parseInt(parts_a[i]);
			part_b = parseInt(parts_b[i]);
			if (part_b < part_a) return 1;
			if (part_b > part_a) return -1;
		}
		return 0;
	});

	return files;
};
