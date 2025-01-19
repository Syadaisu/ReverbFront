// src/Components/Home.tsx

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import ServerBar from "./ServerBar";
import { UserAvatar } from "./IconLib";
import useAuth from "../Hooks/useAuth";
import { BASE_URL, AVATAR_URL } from "../Api/axios";

import EditUserModal from "./EditUserModal";
import UpdateAvatarModal from "./UpdateAvatarModal";

const Home = () => {
  const { auth } = useAuth();

  // State to show/hide modals
  const [showEditUser, setShowEditUser] = useState(false);
  const [showUpdateAvatar, setShowUpdateAvatar] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const handleAvatarUpdate = () => {
    setRefreshFlag((prev) => prev + 1); // Increment to change the query parameter
  };

  return (
    <div className="w-screen h-screen flex bg-gray-800 text-white">
      <ServerBar />
      <div className="flex-grow flex flex-col">
        {/* TOP BAR */}
        <div className="h-12 bg-gray-700 px-4 flex items-center justify-between">
          <div className="font-semibold">
            Welcome, {auth.username}!
          </div>
          <div className="flex items-center space-x-4">
            {/* Button to open "Edit user data" modal */}
            <button
              className="bg-green-600 p-2 rounded"
              onClick={() => setShowEditUser(true)}
            >
              Edit Info
            </button>
            {/* Button to open "Update avatar" modal */}
            <button
              className="bg-blue-600 p-2 rounded"
              onClick={() => setShowUpdateAvatar(true)}
            >
              Change Avatar
            </button>
            {/* Display user's avatar */}
            <UserAvatar
              name={auth.username}
              picture={BASE_URL + AVATAR_URL + auth.avatar}
              refreshflag={refreshFlag}
            />
          </div>
        </div>
        <div className="flex-grow flex overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Conditionally show Modals */}
      {showEditUser && (
        <EditUserModal onClose={() => setShowEditUser(false)} />
      )}
      {showUpdateAvatar && (
        <UpdateAvatarModal onClose={() => setShowUpdateAvatar(false)} onUploadSuccess={handleAvatarUpdate}/>
      )}
    </div>
  );
};

export default Home;
