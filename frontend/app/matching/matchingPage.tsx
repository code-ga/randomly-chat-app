import { useEffect } from "react";
import { useWs } from "../context/ws";
import { useNavigate } from "react-router";

export const MatchingPage = () => {
  const { websocket: ws } = useWs();
  const navigate = useNavigate();
  useEffect(() => {
    window.client?.addEventListener("message", (e) => {
      const message = JSON.parse(e.data);
      if (message.type == "authorized") {
        window.client?.send(JSON.stringify({ type: "match" }));
      }
      if (message.type == "matched") {
        window.client?.send(JSON.stringify({ type: "joinRoom", roomId: message.roomId }));
        navigate("/room/" + message.roomId);
      }
    });
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      Matching
    </div>
  );
};
