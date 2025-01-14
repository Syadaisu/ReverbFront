// src/Components/ServerView.tsx
import React from "react";
import { useParams } from "react-router-dom";
import ChannelBar from "./ChannelBar";
import ChatView from "./ChatView";

const ServerView = () => {
  const { serverId } = useParams();

  return (
    <div className="flex w-full">
      {/* LEFT: Channel list for the current server */}
      <ChannelBar serverId={serverId!} />

      {/* RIGHT: Chat area */}
      <div className="flex-grow bg-gray-700">
        <ChatView serverId={serverId!} />
      </div>
    </div>
  );
};

export default ServerView;
