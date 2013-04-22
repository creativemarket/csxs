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

global.IS_WINDOWS = !!process.platform.match(/^win/);
global.IS_MAC     = !IS_WINDOWS;
global.config     = null;
global.roto       = null;

module.exports = function(roto) {
	global.roto = roto;
	roto.defaultTarget = null;
	roto.options.indent = true;
	roto.options.colorize = true;

	require('./tasks/config.js');
	require('./tasks/git.js');
	require('./tasks/fs.js');
	require('./tasks/ucf.js');
	require('./tasks/amxmlc.js');
	require('./tasks/fdb.js');

	require('./targets/certificate.js');
	require('./targets/changelogs.js');
	require('./targets/create.js');
	require('./targets/compile.js');
	require('./targets/configure.js');
	require('./targets/debug.js');
	require('./targets/package.js');
	require('./targets/publish.js');
};