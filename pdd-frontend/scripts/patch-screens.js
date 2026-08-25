import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

// 1. Patch react-native-screens fabric components
const screensDir = path.join(projectRoot, "node_modules/react-native-screens/src/fabric");
if (fs.existsSync(screensDir)) {
  function patchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      if (fs.statSync(fullPath).isDirectory()) {
        patchDir(fullPath);
      } else if (f.endsWith(".ts") || f.endsWith(".tsx")) {
        let content = fs.readFileSync(fullPath, "utf8");
        let modified = false;

        // Replace CT. namespace with direct names
        if (content.includes("CodegenTypes as CT")) {
          content = content.replace("import type { CodegenTypes as CT,", "import type { Int32, Double, Float, WithDefault, DirectEventHandler, BubblingEventHandler,");
          content = content.replace(/CT\./g, "");
          modified = true;
        }

        // Replace empty ScreenEvent
        if (content.includes("type ScreenEvent = Readonly<{}>;")) {
          content = content.replace("type ScreenEvent = Readonly<{}>;", "type ScreenEvent = Readonly<{\n  target: Int32;\n}>;");
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(fullPath, content, "utf8");
          console.log(`Successfully patched screens file: ${f}`);
        }
      }
    }
  }
  patchDir(screensDir);
}

// 2. Patch react-native VirtualView components
const virtualViewDir = path.join(projectRoot, "node_modules/react-native/src/private/components/virtualview");
if (fs.existsSync(virtualViewDir)) {
  const files = fs.readdirSync(virtualViewDir);
  for (const f of files) {
    const fullPath = path.join(virtualViewDir, f);
    if (f.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("NativeModeChangeEvent")) {
        content = content.replace(/export type NativeModeChangeEvent = (Readonly|\$ReadOnly)<[\s\S]*?>;/, "export type NativeModeChangeEvent = $ReadOnly<{\n  mode: Int32,\n}>;");
        content = content.replace(/Readonly<{/g, "$ReadOnly<{");
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`Successfully patched VirtualView: ${f}`);
      }
    }
  }
}

// 3. Patch react-native specs_DEPRECATED components that fail codegen
const specsDir = path.join(projectRoot, "node_modules/react-native/src/private/specs_DEPRECATED/components");
if (fs.existsSync(specsDir)) {
  const files = fs.readdirSync(specsDir);
  for (const f of files) {
    const fullPath = path.join(specsDir, f);
    if (f.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf8");
      let modified = false;
      
      // Remove all trailing 'as Type;'
      if (content.match(/\s+as\s+[A-Za-z0-9_<>]+;/)) {
        content = content.replace(/\s+as\s+[A-Za-z0-9_<>]+;/g, ";");
        modified = true;
      }
      
      // Convert all Readonly<{ and ReadonlyArray to Flow $ReadOnly syntax
      if (content.includes("Readonly<{") || content.includes("ReadonlyArray<")) {
        content = content.replace(/Readonly<{/g, "$ReadOnly<{");
        content = content.replace(/ReadonlyArray</g, "$ReadOnlyArray<");
        modified = true;
      }

      // Fix AndroidSwipeRefreshLayout colors
      if (content.includes("colors?: ?ColorValue[]")) {
        content = content.replace("colors?: ?ColorValue[]", "colors?: ?$ReadOnlyArray<ColorValue>");
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`Successfully patched specs_DEPRECATED: ${f}`);
      }
    }
  }
}
