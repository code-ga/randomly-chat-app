import { MatchingPage } from "../matching/matchingPage";
import type { Route } from "./+types/matching";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function LoginRoute() {
  return <MatchingPage />;
}
