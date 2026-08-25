// Metro mock for react-native VirtualViewExperimentalNativeComponent
// The real component uses Flow types with nested event payloads (NativeModeChangeEvent)
// that are incompatible with the version of @react-native/codegen used in this project.
// This plain mock prevents the Metro bundler from crashing during the EAS build.
module.exports = {
  __esModule: true,
  default: 'VirtualViewExperimental',
};
