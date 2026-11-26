/**
 * Config plugin: declares the compression foreground service and the
 * permissions it needs (Android 14 mediaProcessing rules).
 * Used from app.json plugins: ["../modules/mediatools/plugin"]
 */
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PROCESSING',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.WAKE_LOCK',
];

module.exports = function withMediaTools(config) {
  config = AndroidConfig.Permissions.withPermissions(config, PERMISSIONS);
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.service = app.service || [];
    const exists = app.service.some(
      (s) => s.$ && s.$['android:name'] === 'expo.modules.mediatools.CompressService'
    );
    if (!exists) {
      app.service.push({
        $: {
          'android:name': 'expo.modules.mediatools.CompressService',
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaProcessing',
        },
      });
    }
    return cfg;
  });
};
