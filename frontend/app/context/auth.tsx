import React from "react";
import { me } from "../services/userService";
import type { User } from "../types";
import LoadingPage from "../components/LoadingPage";
import {
  login as loginService,
  register as registerService,
} from "../services/userService";
interface AuthContext {
  user: User | null;
  loading: boolean;
  error: string | null;
  login?: (email: string, password: string) => ReturnType<typeof loginService>;
  register?: (
    username: string,
    email: string,
    password: string
  ) => ReturnType<typeof registerService>;
  token?: string | null;
}
export const AuthContext = React.createContext<AuthContext>({
  user: null,
  loading: true,
  error: null,
  login: undefined,
  register: undefined,
  token: undefined,
});

export const useAuth = () => React.useContext(AuthContext);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [auth, setAuth] = React.useState<{
    user: User | null;
    loading: boolean;
    error: string | null;
    token?: string | null;
  }>({
    user: null,
    loading: true,
    error: null,
    token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  });

  React.useEffect(() => {
    (async () => {
      try {
        const user = await me();
        if (!user.success) {
          setAuth({
            user: null,
            loading: false,
            error: user.message,
          });
          localStorage.removeItem("token");
          return;
        }
        setAuth((pre) => ({
          ...pre,
          user: user.data,
          loading: false,
          error: null,
        }));
      } catch (error) {
        setAuth({
          user: null,
          loading: false,
          error: (error as Error).message,
        });
        localStorage.removeItem("token");
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    localStorage.removeItem("token");
    const result = await loginService(email, password);
    if (result.success) {
      setAuth({
        user: result.data.user,
        loading: false,
        error: null,
        token: result.data.token,
      });
    } else {
      setAuth({ user: null, loading: false, error: result.message });
    }
    localStorage.setItem("token", result.data.token);
    return result;
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    localStorage.removeItem("token");
    const result = await registerService(username, email, password);
    if (result.success) {
      setAuth({
        user: result.data.user,
        loading: false,
        error: null,
        token: result.data.token,
      });
    } else {
      setAuth({ user: null, loading: false, error: result.message });
    }
    localStorage.setItem("token", result.data.token);
    return result;
  };

  return auth.loading ? (
    <LoadingPage></LoadingPage>
  ) : (
    <AuthContext.Provider value={{ ...auth, login, register }}>
      {children}
    </AuthContext.Provider>
  );
};
