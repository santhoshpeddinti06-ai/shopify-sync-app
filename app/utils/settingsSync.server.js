// app/utils/settingsSync.server.js
import { fetchSettings, pushSettings } from './shopify.server.js';

/**
 * Fetch shop settings from a store
 * @param {string} storeDomain
 * @param {string} accessToken
 */
export async function getSettings(storeDomain, accessToken) {
  return await fetchSettings(storeDomain, accessToken);
}

/**
 * Push settings to a target store
 * @param {string} targetDomain
 * @param {string} accessToken
 * @param {object} settings
 */
export async function updateSettings(targetDomain, accessToken, settings) {
  return await pushSettings(targetDomain, accessToken, settings);
}
