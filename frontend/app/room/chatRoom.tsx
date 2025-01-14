import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import Sidebar from "./Sidebar";
import { getChannel, getChannelMessages } from "../services/channelService";
import type { Message, User } from "../types";
import { useWs } from "../context/ws";
import { getRoomUsers } from "../services/userService";

const ChatBox: React.FC = () => {
  const { roomId } = useParams();
  const [channelName, setChannelName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [inRoomUsers, setInRoomUsers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.client?.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);
      if (data.type == "authorized") {
        window.client?.send(JSON.stringify({ type: "joinRoom", roomId }));
      }
      if (data.type === "userJoined") {
        const user = data.user;
        if (!users.find((u) => u.id === user.id)) {
          setUsers((prevUsers) => [...prevUsers, user]);
        }
        if (!inRoomUsers.find((u) => u === user.id)) {
          setInRoomUsers((prevInRoomUsers) => [...prevInRoomUsers, user.id]);
        }
      } else if (data.type === "message") {
        const message = data.message;

        if (messages.find((m) => m.id === message.id)) {
          return;
        }
        setMessages((prevMessages) => {
          if (prevMessages.find((m) => m.id === message.id)) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else if (data.type === "typing") {
        if (data.isTyping) {
          setTypingUsers((prevTypingUsers) => {
            if (prevTypingUsers.find((id) => id === data.userId)) {
              return prevTypingUsers;
            }
            return [...prevTypingUsers, data.userId];
          });
        } else {
          setTypingUsers((prevTypingUsers) =>
            prevTypingUsers.filter((id) => id !== data.userId)
          );
        }
      } else if (data.type === "userLeft") {
        setInRoomUsers((prevInRoomUsers) =>
          prevInRoomUsers.filter((id) => id !== data.userId)
        );
      }
    });
  }, []);

  // send typing event
  useEffect(() => {
    if (window.client?.readyState !== window.client?.OPEN) return;
    window.client?.send(
      JSON.stringify({
        type: "typing",
        isTyping,
      })
    );
  }, [isTyping]);

  useEffect(() => {
    // Fetch users in the current chat room (replace with your actual API call)
    const fetchUsers = async () => {
      try {
        const data = await getRoomUsers(roomId || "");
        if (!data.success) {
          setError(data.message);
          return;
        }

        setUsers(data.data.users);
        setInRoomUsers(data.data.inRoomUsers);
      } catch (error: any) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [roomId]);

  useEffect(() => {
    // Fetch messages for the current channel (replace with your actual API call)
    const fetchMessages = async () => {
      try {
        const messages = await getChannelMessages(roomId || "");
        if (!messages.success) {
          setError(messages.message);
          return;
        }
        setMessages(messages.data.messages);
        const channelInfo = await getChannel(roomId || "");
        if (!channelInfo.success) {
          setError(channelInfo.message);
          return;
        }

        setChannelName(channelInfo.data.name);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [roomId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    window.client?.send(
      JSON.stringify({
        type: "message",
        content: newMessage,
      })
    );

    setNewMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div>
      {error && (
        <p className="text-red-500 text-2xl text-center bg-red-100 p-2 rounded">
          {error}
        </p>
      )}
      <div className="flex h-screen">
        <Sidebar users={users} inRoomUsers={inRoomUsers} />
        <div className="flex-grow flex-col overflow-y-auto p-4 justify-between">
          <ul className="space-y-4">
            {" "}
            {channelName && (
              <h1 className="text-2xl font-bold mb-4">{channelName}</h1>
            )}
            {messages.map((message) => (
              <li key={message.id} className="flex">
                <span className="text-gray-500">
                  {users.find((user) => user.id === message.author)?.username}:
                </span>
                <span className="ml-2">{message.content}</span>
              </li>
            ))}
            <div ref={messagesEndRef} />
          </ul>
          <div className="w-full">
            {typingUsers.length > 0 && (
              <span className="text-gray-500 ml-2 mb-2">
                {typingUsers.length > 5
                  ? `${typingUsers
                      .slice(0, 5)
                      .map(
                        (id) => users.find((user) => user.id === id)?.username
                      )
                      .join(", ")} and ${typingUsers.length - 5} others`
                  : typingUsers
                      .map(
                        (id) => users.find((user) => user.id === id)?.username
                      )
                      .join(", ")}{" "}
                is typing
              </span>
            )}
            <form onSubmit={handleSubmit} className="p-4 w-full flex max-w-6xl">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  setIsTyping(true);
                  if (typingTimeout) {
                    clearTimeout(typingTimeout);
                    setTypingTimeout(
                      setTimeout(() => {
                        setIsTyping(false);
                      }, 5000)
                    );
                  } else {
                    setTypingTimeout(
                      setTimeout(() => {
                        setIsTyping(false);
                      }, 5000)
                    );
                  }
                }}
                className="border border-gray-300 p-2 rounded w-full"
                placeholder="Type your message..."
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
