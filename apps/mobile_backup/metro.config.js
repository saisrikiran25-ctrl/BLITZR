const { getDefaultConfig } = require('@expo/metro-config');

/**
 * Metro configuration
 * https://expo.fyi/metro-config
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

module.exports = config;
