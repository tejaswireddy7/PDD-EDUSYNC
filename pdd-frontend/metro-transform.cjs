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

module.exports.transform = async function transform(params) {
  const filename = params.filename || "";

  // If this is the problematic VirtualView codegen file, return an empty no-op module
  if (filename.includes(VIRTUAL_VIEW_FILE)) {
    return {
      dependencies: [],
      output: [
        {
          data: {
            code: "module.exports = {};",
            lineCount: 1,
            map: [],
            functionMap: null,
          },
          type: "js/module",
        },
      ],
    };
  }

  // For all other files, delegate to the standard Expo transformer
  return expoTransformer.transform(params);
};
