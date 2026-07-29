import { createFileRoute } from "@tanstack/react-router";
import AssessmentsScreen from "../screens/AssessmentsScreen";

export const Route = createFileRoute("/assessments")({
  component: AssessmentsScreen,
});
