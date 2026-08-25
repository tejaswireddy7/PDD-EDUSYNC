import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

// 1. Patch react-native-screens components
const screensFiles = [
  "node_modules/react-native-screens/src/fabric/ModalScreenNativeComponent.ts",
  "node_modules/react-native-screens/src/fabric/ScreenNativeComponent.ts",
];

for (const relPath of screensFiles) {
  const filePath = path.join(projectRoot, relPath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    const target = "type ScreenEvent = Readonly<{}>;";
    const replacement = "type ScreenEvent = Readonly<{\n  target: Int32;\n}>;";
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Successfully patched screens file: ${relPath}`);
    } else {
      console.log(`Screens file already patched or target not found: ${relPath}`);
    }
  } else {
    console.warn(`Screens file not found to patch: ${relPath}`);
  }
}

// 2. Patch react-native VirtualViewExperimentalNativeComponent to fix Metro codegen crash
const virtualViewPath = "node_modules/react-native/src/private/components/virtualview/VirtualViewExperimentalNativeComponent.js";
const virtualViewFilePath = path.join(projectRoot, virtualViewPath);

if (fs.existsSync(virtualViewFilePath)) {
  let content = fs.readFileSync(virtualViewFilePath, "utf8");
  const startMarker = "export type NativeModeChangeEvent = Readonly<{";
  const endMarker = "}>;";
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex !== -1) {
    const endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex !== -1) {
      const originalBlock = content.substring(startIndex, endIndex + endMarker.length);
      // Only replace if it contains nested structures (i.e. targetRect)
      if (originalBlock.includes("targetRect")) {
        const replacement = "export type NativeModeChangeEvent = Readonly<{\n  mode: Int32,\n}>;";
        content = content.replace(originalBlock, replacement);
        fs.writeFileSync(virtualViewFilePath, content, "utf8");
        console.log(`Successfully patched VirtualView codegen event: ${virtualViewPath}`);
      } else {
        console.log(`VirtualView codegen event is already patched: ${virtualViewPath}`);
      }
    }
  }
} else {
  console.warn(`VirtualView file not found to patch: ${virtualViewPath}`);
}
