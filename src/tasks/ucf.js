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
var path = require('path');


roto.defineTask('csxs.ucf', function(callback, options) {
	var err = false;
	var args = [
		'-jar',
		path.resolve(__dirname, '../../bin/ucf.jar'),
		'-package',
		'-storetype', 'PKCS12',
		'-keystore', options.keystore,
		'-storepass', options.password,
		'-tsa', 'https://timestamp.geotrust.com/tsa',
		options.output,
		'-C', options.input, '.'
	];

	console.log(roto.colorize(options.output, 'white'));
	console.log(roto.colorize('java ' + args.join(' '), 'magenta'));

	var ucf = spawn('java', args);
	ucf.stdout.on('data', function (data) { process.stdout.write(data); });
	ucf.stderr.on('data', function (data) { process.stderr.write(data); err = true; });
	ucf.on('exit', function(code) {
		if (err) {
			console.error(roto.colorize('ERROR: ', 'red') + 'Unable to create ZXP package.');
			callback(false);
		} else {
			callback();
		}
	});
});