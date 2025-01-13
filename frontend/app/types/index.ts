export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  status: "pending" | "offline" | "joined" | "online";
}

export interface ServerResponse<T> {
  status: string;
  success: boolean;
  message: string;
  data: T;
}

export interface Channel {
  id: number;
  name: string;
  users: number[] | null;
  owner: number;
  messages: number[] | null;
}

export interface Message {
  content: string;
  id: number;
  chatId: number;
  author: number;
}