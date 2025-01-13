import React from "react";
import type { User } from "../types";

const Sidebar: React.FC<{ users: User[]; inRoomUsers: number[] }> = ({
  users,
  inRoomUsers,
}) => {
  return (
    <aside className="bg-gray-800 p-4 min-w-[200px]">
      <h2 className="text-lg font-bold mb-4 text-center">Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="py-2">
            {user.username}({user.status}) -{" "}
            {inRoomUsers.includes(user.id) ? "in room" : "not in room"}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
