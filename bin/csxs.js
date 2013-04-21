#!/usr/bin/env node

/**
 * Command Line Interface
 *
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

var path     = require('path');
var fs       = require('fs');
var roto     = require('roto');
var colorize = roto.colorize;
var optimist = require('optimist');

optimist.usage('Usage: $0 [target] [options]')

var i, n, key;

// load build targets
// ------------------------------------------------------------------------------------

require('../src/build.js')(roto);

// extract global options & target
// ------------------------------------------------------------------------------------

var argv = optimist.argv;
var target = argv._.length ? argv._[0] : null;
var blacklist = ['_', '$0'];
var options = {};
for (key in argv) {
	if (argv.hasOwnProperty(key) && blacklist.indexOf(key) === -1) {
		options[key] = argv[key];
	}
}
for (i = 1; i < argv._.length; i++) {
	options[argv._[i]] = true;
}

// display help
// ------------------------------------------------------------------------------------

if (options['help']) {
	var print_target = function(name, options) {
		var selected = name === roto.defaultTarget;
		var bullet   = selected ? '■' : '□';
		process.stdout.write(colorize(' ' + bullet, 'gray') + ' ' + name);
		if (selected) {
			process.stdout.write(colorize(' (default)', 'blue'));
		}
		if (options && options.description) {
			process.stdout.write(colorize(': ' + options.description + '', 'gray'));
		}
		process.stdout.write('\n');
	};

	process.stdout.write('\n' + optimist.help());

	// defined targets + 'all'
	process.stdout.write(colorize('Available Targets:\n', 'white'));
	print_target('all');
	for (var key in roto._project.targets) {
		if (roto._project.targets.hasOwnProperty(key)) {
			print_target(key, roto._project.targets[key].options);
		}
	}

	process.stdout.write('\nFor more information, find the documentation at:\n');
	process.stdout.write(colorize('http://github.com/creativemarket/csxs', 'underline') + '\n\n');
	process.exit(0);
}

// execute build
// ------------------------------------------------------------------------------------

roto.run(target, options, function(success) {
	process.exit(success !== false ? 0 : 1);
});