import { createFileRoute } from "@tanstack/react-router";
import EvaluationScreen from "../screens/EvaluationScreen";

export const Route = createFileRoute("/evaluation")({
  component: EvaluationScreen,
});
