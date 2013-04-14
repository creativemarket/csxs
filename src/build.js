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

// read csxs.json in project folder
// var fs = require('fs');
// var path_package = process.cwd() + '/csxs.json';

global.IS_WINDOWS = !!process.platform.match(/^win/);
global.IS_MAC     = !IS_WINDOWS;

module.exports = function(roto) {
	require('./targets/changelogs.js')(roto);
	require('./targets/create.js')(roto);
	require('./targets/compile.js')(roto);
	require('./targets/configure.js')(roto);
	require('./targets/package.js')(roto);
	require('./targets/release.js')(roto);
};