// src/Components/Home.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import ServerBar from "./ServerBar";
import { UserAvatar } from "./IconLib";
import useAuth from "../Hooks/useAuth";

const Home = () => {
  const { auth } = useAuth(); 
  // auth = { id, username, email, accessToken, avatar }

  return (
    <div className="w-screen h-screen flex bg-gray-800 text-white">
      {/* LEFT: ServerBar (Discord left side) */}
      <ServerBar />

      {/* RIGHT: The rest of the screen for nested routes */}
      <div className="flex-grow flex flex-col">
        {/* TOP BAR */}
        <div className="h-12 bg-gray-700 px-4 flex items-center justify-between">
          <div className="font-semibold">
            Welcome, {auth.username}!
          </div>
          <UserAvatar name={auth.username} picture={auth.avatar} />
        </div>

        {/* The rest -> Outlet for server or DM content */}
        <div className="flex-grow flex overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Home;
