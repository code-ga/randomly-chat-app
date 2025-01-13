import type { Channel, Message, ServerResponse } from "../types";

export const getChannel = async (id: string): Promise<ServerResponse<Channel>> => {
  const response = await fetch(`http://localhost:3000/channel/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

export const getChannelMessages = async (channelId: string): Promise<ServerResponse<{ messages: Message[] }>> => {
  const response = await fetch(`http://localhost:3000/channel/${channelId}/messages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export const createChannel = async (name: string): Promise<ServerResponse<{ channel: Channel }>> => {
  const response = await fetch("http://localhost:3000/channel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  return response.json();
}

export const getMeChannels = async (): Promise<ServerResponse<{ channels: Channel[] }>> => {
  const response = await fetch("http://localhost:3000/channel/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${localStorage.getItem("token")}`,
    },
  });
  return response.json();
}