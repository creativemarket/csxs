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

var HOSTS = require('../../hosts.json');
var hosts = module.exports = {};

/**
 * Returns information about a Creative Suite product.
 *
 * @param {string} key
 * @param {string} version
 * @returns {object}
 */
hosts.getProduct = function(key, cs_version) {
	key = key.toLowerCase();
	if (!cs_version) cs_version = '6.0';
	else cs_version = parseFloat(cs_version).toFixed(1);
	if (!HOSTS.hasOwnProperty(cs_version)) throw new Error('Unknown CS Version "' + cs_version + '"');
	if (!HOSTS[cs_version].hasOwnProperty(key)) throw new Error('Unknown CS Product "' + key + '" (CS' + cs_version + ')');
	return HOSTS[cs_version][key];
};

/**
 * Returns the individual product version range
 * given a list of Creative Suite versions.
 *
 * @param {string} key
 * @param {array} cs_versions
 * @returns {object}
 */
hosts.getVersionRange = function(key, cs_versions) {
	var i, n, min, max, host;

	for (i = 0, n = cs_versions.length; i < n; i++) {
		host = hosts.getProduct(key, cs_versions[i]);
		if (!min || parseFloat(host.version.min) < parseFloat(min)) min = host.version.min;
		if (!max || parseFloat(host.version.max) > parseFloat(max)) max = host.version.max;
	}

	return {min: min, max: max};
};