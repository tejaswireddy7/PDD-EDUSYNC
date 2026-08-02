import { createFileRoute } from "@tanstack/react-router";
import CourseLearnScreen from "../screens/CourseLearnScreen";

export const Route = createFileRoute("/course-learn")({
  component: CourseLearnScreen,
});
