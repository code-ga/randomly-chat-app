import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/auth";

interface NavbarProps {
  onChannelCreate: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onChannelCreate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRandomJoin = () => {
    navigate(`/matching`);
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <h1>Chat App</h1>
      <div>
        {user ? (
          <>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-2"
              onClick={onChannelCreate}
            >
              Create New Channel
            </button>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleRandomJoin}
            >
              Randomize Join
            </button>
          </>
        ) : (
          <>
            <Link
              to={"/login"}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
