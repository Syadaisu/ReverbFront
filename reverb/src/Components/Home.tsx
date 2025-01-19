// src/Components/Home.tsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import ServerBar from "./ServerBar";
import { UserAvatar } from "./IconLib";
import useAuth from "../Hooks/useAuth";
import { BASE_URL, AVATAR_URL } from "../Api/axios";
import EditUserModal from "./EditUserModal";

const Home = () => {
  const { auth } = useAuth(); 
  // auth = { id, username, email, accessToken, avatar }
  console.log("Avatar:", BASE_URL + AVATAR_URL + auth.avatar);

  // For controlling the edit user popup
  const [showUserEditModal, setShowUserEditModal] = useState<boolean>(false);

  const handleAvatarClick = () => {
    setShowUserEditModal(true);
  };

  return (
    <div className="w-screen h-screen flex bg-gray-800 text-white">
      {/* LEFT: ServerBar (like Discord's left side) */}
      <ServerBar />

      {/* RIGHT: The rest of the screen for nested routes */}
      <div className="flex-grow flex flex-col">
        {/* TOP BAR */}
        <div className="h-12 bg-gray-700 px-4 flex items-center justify-between">
          <div className="font-semibold">
            Welcome, {auth.username}!
          </div>
          <div onClick={handleAvatarClick} className="cursor-pointer">
            <UserAvatar
              name={auth.username}
              picture={BASE_URL + AVATAR_URL + auth.avatar}
            />
          </div>
        </div>

        {/* The rest -> Outlet for server or DM content */}
        <div className="flex-grow flex overflow-hidden">
          <Outlet />
        </div>
      </div>

      {showUserEditModal && (
        <EditUserModal onClose={() => setShowUserEditModal(false)} />
      )}
    </div>
  );
};

export default Home;
