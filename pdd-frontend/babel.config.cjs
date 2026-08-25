module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    overrides: [
      {
        // Exclude VirtualViewExperimentalNativeComponent from the babel-plugin-codegen
        // because its NativeModeChangeEvent uses nested Flow types that crash codegen.
        // See: https://github.com/facebook/react-native/issues/VirtualView
        exclude: [
          /node_modules\/react-native\/src\/private\/components\/virtualview\/VirtualViewExperimentalNativeComponent\.js/,
        ],
        plugins: [],
      },
    ],
  };
};
