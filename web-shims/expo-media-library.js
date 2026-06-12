// Lightweight web shim for expo-media-library to avoid native-module errors in web builds
const noop = async () => {};

module.exports = {
  // Permissions
  requestPermissionsAsync: async () => ({ granted: true }),
  getPermissionsAsync: async () => ({ granted: true }),
  presentPermissionsPicker: async () => {},

  // Asset/Album APIs (no-op or simple fallbacks)
  createAssetAsync: async (uri) => ({ uri }),
  getAlbumAsync: async (name) => null,
  addAssetsToAlbumAsync: async (_assets, _album, _copy) => {},
  createAlbumAsync: async (_name, _asset, _copy) => ({}),

  // Listener stubs
  addListener: (_fn) => ({ remove: () => {} }),
  removeAllListeners: () => {},
};
