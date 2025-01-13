import { useState, useEffect } from "react";
import { Link } from "react-router";
import LoadingPage from "../components/LoadingPage";
import Navbar from "../components/Navbar";
import { createChannel, getMeChannels } from "../services/channelService";
import type { Channel } from "../types";

const HomePage = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleOnChannelCreate = async () => {
    const name = prompt("Enter channel name");
    if (name) {
      const channel = await createChannel(name);
      if (channel.success) {
        window.location.href = `/room/${channel.data.channel.id}`;
      } else {
        alert(channel.message);
      }
    }
  };
  useEffect(() => {
    getMeChannels()
      .then((data) => {
        if (!data.success) {
          setLoading(false);
          setError(data.message);
          return;
        }
        setChannels(data.data.channels);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, []);
  return (
    <div>
      <Navbar onChannelCreate={handleOnChannelCreate} />
      <div className=" min-h-screen bg-gray-800 p-10">
        <h1 className="text-3xl">Welcome to Randomize Chat App!</h1>
        <p className="mt-4">
          Sometime you will be disconnected from the server. Please refresh the
          page. If it doesn't work, please try again. The url of room is the invitation url of room
        </p>
        <div className="mt-8">
          <h2>History of Chats</h2>
          {error && <p className="text-red-500 font-bold">{error}</p>}
          {loading ? (
            <LoadingPage></LoadingPage>
          ) : (
            <ChannelList channels={channels} />
          )}
        </div>
      </div>
    </div>
  );
}


const ChannelList: React.FC<{ channels: Channel[] }> = ({ channels }) => {
  return (
    <table className="table-auto w-full">
      <thead>
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Number of Users</th>
          {/* Add other table headers as needed */}
        </tr>
      </thead>
      <tbody>
        {channels.map((channel) => (
          <tr key={channel.id} className="hover:bg-gray-900">
            <td className="border px-4 py-2 text-blue-600">
              <Link to={`/room/${channel.id}`}>{channel.name}</Link>
            </td>
            <td className="border px-4 py-2">Number of Users: {channel.users?.length || 0}</td>
            {/* Add other table cells as needed */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default HomePage