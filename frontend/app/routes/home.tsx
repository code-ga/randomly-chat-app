import LoadingPage from "../components/LoadingPage";
import { useAuth } from "../context/auth";
import HomePage from "../home/home";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const { loading } = useAuth();
  return loading ? <LoadingPage></LoadingPage> : <HomePage></HomePage>;
}
