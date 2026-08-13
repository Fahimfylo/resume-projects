const SystemSetting = require("../models/SystemSetting");

let settingsCache = null;

// Load full settings document into cache
const loadSettingsToCache = async () => {
  settingsCache = await SystemSetting.findOne({}).lean();
};

// Get single setting
const getSetting = async (key) => {
  if (!settingsCache) {
    await loadSettingsToCache();
  }

  // Return setting value as stored (including false/empty string), or null if missing
  if (!settingsCache) return null;
  return Object.prototype.hasOwnProperty.call(settingsCache, key)
    ? settingsCache[key]
    : null;
};

// Refresh cache after admin updates
const refreshSettingsCache = async () => {
  await loadSettingsToCache();
};

module.exports = {
  loadSettingsToCache,
  getSetting,
  refreshSettingsCache,
};
