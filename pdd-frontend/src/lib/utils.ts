import { StyleProp } from "react-native";

// Premium React Native utility to merge stylesheets and conditional style arrays safely
export function cn(...styles: Array<StyleProp<any> | undefined | null | false>): StyleProp<any> {
  return styles.filter(Boolean);
}
