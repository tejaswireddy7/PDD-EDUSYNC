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
    if (params.src) {
      if (params.src.includes("OTEL_PKG")) {
        params.src = params.src.replace(/import\([\s\S]*?OTEL_PKG\)/g, 'Promise.reject(new Error("OTEL not found"))');
      }
      if (params.src.includes("webpackIgnore") || params.src.includes("turbopackIgnore")) {
        params.src = params.src.replace(/import\s*\(\s*\/\*[\s\S]*?\*\/\s*[a-zA-Z0-9_$]+\s*\)/g, 'Promise.reject(new Error("Dynamic import not supported"))');
      }
    }
    return expoTransformer.transform(params);
  },
};
