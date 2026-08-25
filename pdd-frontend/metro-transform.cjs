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
    const filename = params.filename || "";

    // If this is any VirtualView codegen or component file in react-native, return a safe mock module
    if (filename.toLowerCase().includes("virtualview")) {
      return {
        dependencies: [],
        output: [
          {
            data: {
              code: "module.exports = { __esModule: true, default: function(props) { return (props && props.children) || null; }, VirtualViewMode: { Visible: 0, Prerender: 1, Hidden: 2 }, VirtualViewRenderState: { Unknown: 0, Rendered: 1, None: 2 }, createHiddenVirtualView: function() { return function(props) { return (props && props.children) || null; }; } };",
              lineCount: 1,
              map: [],
              functionMap: null,
            },
            type: "js/module",
          },
        ],
      };
    }

    try {
      // For all other files, delegate to the standard Expo transformer
      return await expoTransformer.transform(params);
    } catch (err) {
      // If Babel/codegen fails on an internal react-native private spec/component, fall back to a safe empty module
      if (filename.includes("react-native") && (filename.includes("private") || filename.includes("specs"))) {
        console.warn(`[metro-transform] Bypassing codegen failure in: ${filename}`);
        return {
          dependencies: [],
          output: [
            {
              data: {
                code: "module.exports = { __esModule: true, default: function(props) { return (props && props.children) || null; } };",
                lineCount: 1,
                map: [],
                functionMap: null,
              },
              type: "js/module",
            },
          ],
        };
      }
      throw err;
    }
  },
};
