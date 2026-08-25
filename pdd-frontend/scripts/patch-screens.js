import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

const filesToPatch = [
  "node_modules/react-native-screens/src/fabric/ModalScreenNativeComponent.ts",
  "node_modules/react-native-screens/src/fabric/ScreenNativeComponent.ts",
];

for (const relPath of filesToPatch) {
  const filePath = path.join(projectRoot, relPath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    const target = "type ScreenEvent = Readonly<{}>;";
    const replacement = "type ScreenEvent = Readonly<{\n  target: Int32;\n}>;";
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Successfully patched: ${relPath}`);
    } else {
      console.log(`Already patched or target not found in: ${relPath}`);
    }
  } else {
    console.warn(`File not found to patch: ${relPath}`);
  }
}
