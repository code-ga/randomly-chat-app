import type { User, ServerResponse } from "../types";

export const login = async (email: string, password: string): Promise<ServerResponse<{ user: User; token: string }>> => {
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  return response.json();
};

export const register = async (
  username: string,
  email: string,
  password: string
): Promise<ServerResponse<{ user: User; token: string }>> => {
  const response = await fetch("http://localhost:3000/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
    credentials: "include",
  });
  return response.json();
};

export const me = async (): Promise<ServerResponse<User>> => {
  const response = await fetch("http://localhost:3000/auth/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${localStorage.getItem("token")}`,
    },
  });
  return response.json();
};


export const getRoomUsers = async (roomId: string): Promise<ServerResponse<{ users: User[], inRoomUsers: number[] }>> => {
  const response = await fetch(`http://localhost:3000/channel/${roomId}/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};