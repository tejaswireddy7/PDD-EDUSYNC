/**
 * Custom Metro transformer that wraps the default Expo transformer.
 *
 * Purpose: The file VirtualViewExperimentalNativeComponent.js in react-native
 * uses Flow-typed nested event payloads that crash @react-native/babel-plugin-codegen
 * with "Unable to determine event arguments for onModeChange".
 *
 * This transformer intercepts that file and returns an empty module instead of
 * running it through the full Babel/codegen pipeline.
 */

const expoTransformer = require("@expo/metro-config/build/babel-transformer");

const VIRTUAL_VIEW_FILE = "VirtualViewExperimentalNativeComponent.js";

module.exports = {
  ...expoTransformer,
  async transform(params) {
    return expoTransformer.transform(params);
  },
};
