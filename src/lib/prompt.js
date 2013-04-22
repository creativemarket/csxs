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

var prompt = module.exports = function(schema, callback) {
	var delimiter = ': ';
	var args = arguments;
	var input = function() {
		process.stdout.write('> ');
		process.stdin.resume();
		process.stdin.once('data', function(data) {
			var value = data.toString().replace(/^[\s"]+|[\s"]+$/g, '');
			var err   = null;

			if (schema.required && !value.length) {
				err = 'This field is required.';
			} else if (schema.format) {
				try { value = schema.format(value); }
				catch (e) { err = e.message; }
			} else if (schema.pattern && !schema.pattern.test(value)) {
				err = schema.message || 'Invalid value.';
			}

			if (err) {
				console.error(roto.colorize('ERROR: ', 'red') + err);
				return input();
			}

			callback(null, value);
		});
	};

	console.log(roto.colorize(schema.title, 'white'));
	console.log(roto.colorize(schema.description, 'gray'));
	input();
};