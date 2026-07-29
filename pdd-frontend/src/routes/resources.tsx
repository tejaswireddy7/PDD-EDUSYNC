import { createFileRoute } from "@tanstack/react-router";
import ResourcesScreen from "../screens/ResourcesScreen";

export const Route = createFileRoute("/resources")({
  component: ResourcesScreen,
});
