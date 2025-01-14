// src/Components/ChannelBar.tsx
import React, { useEffect, useState } from "react";
import { ChannelButton } from "./IconLib";
import { useStompContext } from "../Hooks/useStompContext";

interface ChannelData {
  id: string;
  name: string;
  description?: string;
  serverId: string;
}

const ChannelBar = ({ serverId }: { serverId: string }) => {
  const stomp = useStompContext();
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [chName, setChName] = useState("");
  const [chDesc, setChDesc] = useState("");

  // Subscribe to new channels for this server
  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    const sub = stomp.onChannelCreated(serverId, (event) => {
      // event.channel => { id, name, description, serverId }
      setChannels((prev) => [...prev, event.channel]);
    });
    return () => sub?.unsubscribe();
  }, [stomp, serverId]);

  // Initially, fetch existing channels from your REST API
  // For brevity, we skip that. We'll have an empty array plus new ones.

  const handleCreateChannel = () => {
    if (!chName.trim()) return;
    stomp.createChannel(serverId, chName, chDesc);
    setChName("");
    setChDesc("");
    setShowCreateChannel(false);
  };

  return (
    <div className="w-56 bg-gray-900 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">Channels</h2>
        <button onClick={() => setShowCreateChannel(true)}>+</button>
      </div>
      <div className="space-y-2">
        {channels.map((ch) => (
          <ChannelButton key={ch.id} name={`#${ch.name}`} />
        ))}
      </div>

      {showCreateChannel && (
        <div className="absolute bg-gray-700 p-3 shadow rounded">
          <input
            className="p-1 text-black"
            placeholder="Channel Name"
            value={chName}
            onChange={(e) => setChName(e.target.value)}
          />
          <textarea
            className="p-1 text-black mt-2"
            placeholder="Description"
            value={chDesc}
            onChange={(e) => setChDesc(e.target.value)}
          />
          <div>
            <button
              className="bg-blue-500 p-1 mt-2"
              onClick={handleCreateChannel}
            >
              Create
            </button>
            <button
              className="bg-gray-500 p-1 mt-2 ml-2"
              onClick={() => setShowCreateChannel(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelBar;
