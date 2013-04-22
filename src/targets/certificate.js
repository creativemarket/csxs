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

var _     = require('lodash');
var fs    = require('fs');
var spawn = require('child_process').spawn;


roto.addTarget('certificate', {
	description: 'Generates a self-signing certificate.'
}, function(options) {
	var subject_ca;
	var subject_ia;

	_.extend({
		password: 'password',
		output: 'certificate-self.p12'
	}, options);

	var openssl = function(args) {
		roto.addTask(function(callback) {
			if (typeof args === 'function') {
				args = args();
			}
			console.log(roto.colorize('openssl ' + args.join(' '), 'magenta'));
			var openssl = spawn('openssl', args, {stdio: 'inherit'});
			openssl.on('exit', function(code) {
				if (code === 0) return callback();
				console.error(roto.colorize('ERROR: ', 'red') + 'An error occurred when generating the code signing certificate.');
				callback(false);
			});
		});
	};

	// check for compatible operating system
	roto.addTask(function(callback) {
		if (!IS_MAC) {
			console.error(roto.colorize('ERROR: ', 'red') + ' Key generation is currently only supported on OSX.');
			return callback(false);
		}
		console.log('Generating self-signing certificate...');
		callback();
	});

	// load project configuration to `config` global
	roto.addTask('csxs.config_load');

	// subject info
	roto.addTask(function(callback) {
		subject_ca = '/CN=' + config.author + ' Code Signing/O=' + config.author + '/C=US';
		subject_ia = '/CN=' + config.author + '/O=' + config.author + '/C=US';
		callback();
	});

	// openssl genrsa -out ca.key 4096
	openssl(['genrsa', '-out', 'ca.key', '4096']);

	// openssl req -new -x509 -days 1826 -key ca.key -out ca.crt
	openssl(function() {
		return ['req', '-new', '-x509', '-days', '1826', '-key', 'ca.key', '-subj', subject_ca, '-out', 'ca.crt'];
	});

	// openssl genrsa -out ia.key 4096
	openssl(['genrsa', '-out', 'ia.key', '4096']);

	// openssl req -new -key ia.key -out ia.csr
	openssl(function() {
		return ['req', '-new', '-key', 'ia.key', '-subj', subject_ia, '-out', 'ia.csr'];
	});

	// openssl x509 -req -days 730 -in ia.csr -CA ca.crt -CAkey ca.key -set_serial 01 -out ia.crt
	openssl(['x509', '-req', '-days', '730', '-in', 'ia.csr', '-CA', 'ca.crt', '-CAkey', 'ca.key', '-set_serial', '01', '-out', 'ia.crt']);

	// openssl pkcs12 -export -out ia.p12 -inkey ia.key -in ia.crt -chain -CAfile ca.crt
	openssl(['pkcs12', '-export', '-out', options.output, '-inkey', 'ia.key', '-in', 'ia.crt', '-passout', 'pass:' + options.password, '-chain', '-CAfile', 'ca.crt']);

	// clean up
	roto.addTask(function(callback) {
		fs.unlinkSync('ca.key');
		fs.unlinkSync('ca.crt');
		fs.unlinkSync('ia.crt');
		fs.unlinkSync('ia.csr');
		fs.unlinkSync('ia.key');
		console.log(options.output);
		console.log(roto.colorize('Certificate generated.', 'green'));
		callback();
	});

});