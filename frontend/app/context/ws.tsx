import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import LoadingPage from "../components/LoadingPage";
import { useAuth } from "./auth";
interface wsContext {
  websocket?: WebSocket | null;
  isOpen: boolean;
  loading: boolean;
  roomId: string | null;
  joinRoom: (roomId: string) => void;
}
export const wsContext = React.createContext<wsContext>({
  websocket: null,
  isOpen: false,
  loading: true,
  roomId: null,
  joinRoom: () => {},
});

export const useWs = () => React.useContext(wsContext);

const URL = !import.meta.env.DEV
  ? "wss://randomize-chat-app.nbth.hackclub.app/ws"
  : "ws://localhost:3000/ws";
declare global {
  interface Window {
    client?: WebSocket | null;
  }
}
const WsContextProvider: React.FC = () => {
  const [websocketClient, setWebsocketClient] = useState<
    WebSocket | undefined | null
  >(window.client);
  const [waitingToReconnect, setWaitingToReconnect] = useState<boolean | null>(
    false
  );
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Array<MessageEvent<any>>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  function addMessage(message: MessageEvent<any>) {
    setMessages([...messages, message]);
  }

  useEffect(() => {
    if (waitingToReconnect) {
      return;
    }
    const client = websocketClient || new WebSocket(URL);
    setWebsocketClient(client);
    window.client = client;

    client.onerror = (e) => console.error(e);

    client.onopen = () => {
      setIsOpen(true);
      console.log("ws opened", client);
      setWebsocketClient(client);
      if (!token) {
        navigate("/login");
        return;
      }
      client.send(JSON.stringify({ type: "authorize", token }));
    };

    client.onclose = (e) => {
      if (e.code === 1008) {
        // unauthorized
        navigate("/login");
      }
      if (websocketClient) {
        // Connection failed
        console.log("ws closed by server");
      } else {
        // Cleanup initiated from app side, can return here, to not attempt a reconnect
        console.log("ws closed by app component unmount");
        return;
      }

      if (waitingToReconnect) {
        return;
      }

      // Parse event code and log
      setIsOpen(false);
      console.log("ws closed");

      // Setting this will trigger a re-run of the effect,
      // cleaning up the current websocket, but not setting
      // up a new one right away
      setWaitingToReconnect(true);
      setWebsocketClient(null);

      // This will trigger another re-run, and because it is false,
      // the socket will be set up again
      setTimeout(() => setWaitingToReconnect(null), 5000);
    };

    client.addEventListener("message", (message) => {
      const data = JSON.parse(message.data);
      if (data.type == "authorized") {
        setLoading(false);
        setWebsocketClient(client);
        if (roomId) {
          client.send(JSON.stringify({ type: "joinRoom", roomId }));
        }
      } else if (data.type == "joinRoom") {
        setRoomId(data.roomId);
      } else if (data.type == "leaveRoom") {
        setRoomId(null);
      }
      addMessage(message);
    });
  }, [waitingToReconnect]);

  const joinRoom = (roomId: string) => {
    if (websocketClient) {
      websocketClient.send(JSON.stringify({ type: "joinRoom", roomId }));
    }
  };

  return loading ? (
    <LoadingPage></LoadingPage>
  ) : (
    <wsContext.Provider
      value={{
        websocket: websocketClient,
        isOpen,
        loading,
        roomId,
        joinRoom,
      }}
    >
      <Outlet></Outlet>
    </wsContext.Provider>
  );
};
export default WsContextProvider;
