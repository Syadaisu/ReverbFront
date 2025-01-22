import React, { useState } from "react";
import ServerBar from "./ServerBar";
import ChannelBar from "./ChannelBar";
import ChatView from "./ChatView";
import { UserAvatar } from "./IconLib";
import useAuth from "../Hooks/useAuth";
import { BASE_URL, AVATAR_URL } from "../Api/axios";

import EditUserModal from "./EditUserModal";
import UpdateAvatarModal from "./UpdateAvatarModal";

const Home = () => {
  const { auth,logout } = useAuth();

  // State for user dropdown modals
  const [showEditUser, setShowEditUser] = useState(false);
  const [showUpdateAvatar, setShowUpdateAvatar] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Toggle for user avatar dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);


  const handleLogout = () => {
    
    logout();
    //Route to login page

    console.log("Logging out...");
  }

  // When avatar is updated, force a re-render by incrementing `refreshFlag`
  const handleAvatarUpdate = () => {
    setRefreshFlag((prev) => prev + 1);
  };

  // Track which server/channel is selected
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  return (
    <div className="w-screen h-screen flex bg-gray-800 text-white">
      {/** MAIN AREA */}
      <div className="flex-grow flex flex-col">
        {/** TOP BAR */}
        <div className="h-16 bg-gray-700 px-4 flex items-center justify-between">
          <div className="font-semibold text-lg">
            Welcome, {auth?.username}!
          </div>

          {/** User Avatar + Dropdown */}
          <div className="relative pt-2">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <UserAvatar
                name={auth.username}
                picture={BASE_URL + AVATAR_URL + auth.avatar} 
                refreshflag={refreshFlag}
              />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-0 w-40 bg-gray-700 rounded shadow-md z-10">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                  onClick={() => {
                    setShowEditUser(true);
                    setUserMenuOpen(false);
                  }}
                >
                  Edit Info
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                  onClick={() => {
                    setShowUpdateAvatar(true);
                    setUserMenuOpen(false);
                  }}
                >
                  Change Avatar
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-red-500"
                  onClick={() => {
                    handleLogout();
                    console.log("Logging out...");
                  }}
                  >
                  Logout
                  </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/** LEFT SIDE: ServerBar (always visible) */}
          <ServerBar
            onSelectServer={(serverId: number) => {
              // When user selects a server, reset channel to null
              console.log("Selected server:", serverId); // debug check
              setSelectedServerId(serverId);
              setSelectedChannelId(null);
            }}
          />
          {/** CHANNEL BAR */}
          {selectedServerId ? (
            <ChannelBar
              serverId={selectedServerId}
              onChannelSelect={(channelId: number) => setSelectedChannelId(channelId)}
            />
          ) : (
            <div> 
            </div>
          )}

          {/** CHAT AREA */}
          <div className="flex-grow">
            {selectedChannelId ? (
              <ChatView 
                serverId={selectedServerId!} 
                channelId={selectedChannelId} 
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                {selectedServerId
                  ? "Select a channel to start chatting"
                  : "No server selected"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/** Modals */}
      {showEditUser && <EditUserModal onClose={() => setShowEditUser(false)} />}
      {showUpdateAvatar && (
        <UpdateAvatarModal
          onClose={() => setShowUpdateAvatar(false)}
          onUploadSuccess={handleAvatarUpdate}
        />
      )}
    </div>
  );
};

export default Home;
