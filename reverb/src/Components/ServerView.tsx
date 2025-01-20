// src/Components/ServerView.tsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import ChannelBar from "./ChannelBar";
import ChatView from "./ChatView";

const ServerView = () => {
  const { serverId } = useParams<{ serverId: string }>();
  console.log("Server ID:", serverId);

  // 1) local state for which channel is active
  const [activeChannelId, setActiveChannelId] = useState<number>(0);

  if (!serverId) {
    return <div>Invalid server ID.</div>;
  }

  // 2) pass a callback to ChannelBar so it can set 'activeChannelId'
  return (
    <div className="flex w-full">
      <ChannelBar 
        serverId={Number(serverId)} 
        onChannelSelect={(chId) => setActiveChannelId(chId)} 
      />

      <div className="flex-grow bg-gray-700">
        {/* pass active channel to ChatView */}
        <ChatView serverId={Number(serverId)} channelId={activeChannelId} />
      </div>
    </div>
  );
};

export default ServerView;
