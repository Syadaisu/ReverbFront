import React, { useEffect, useState } from "react";
import { ChannelButton, ServerButton, UserAvatar } from "./IconLib";
import { useStompContext } from "../Hooks/useStompContext";
import useAuth from "../Hooks/useAuth";
import { getChannels, getServer } from "../Api/axios";
import EditChannelModal from "./EditChannelModal";
import DeleteChannelConfirmation from "./DeleteChannelConfirmation";

// Example type: adapt to your actual server-info shape
interface ServerInfo {
  serverId: number;
  serverName: string;
  serverDescription?: string;
  avatarUrl?: string;  // If you store an avatar for the server
}

interface ChannelData {
  id: string;
  name: string;
  description?: string;
  serverId: string;
}

interface ChannelBarProps {
  serverId: number;
  onChannelSelect: (channelId: number) => void;
}

const ChannelBar: React.FC<ChannelBarProps> = ({ serverId, onChannelSelect }) => {
  const { auth } = useAuth();
  const stomp = useStompContext();

  // Could store server info if you want to show an avatar or name
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [chName, setChName] = useState("");
  const [chDesc, setChDesc] = useState("");

  // Dropdown for channel Edit/Delete
  const [openChannelMenu, setOpenChannelMenu] = useState<string | null>(null);

  // Channel modals
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // (Optional) fetch or store server info
  useEffect(() => {
    getServer(auth.accessToken, serverId)
      .then((resp) => {
        if (resp.data) {
          setServerInfo({
            serverId,
            serverName: resp.data.serverName,
            serverDescription: resp.data.description,
            avatarUrl: undefined
          });
        }
      })
      .catch(console.error);
  }, [serverId]);

  // Initially fetch channels
  useEffect(() => {
    if (!auth?.accessToken) return;
    getChannels(auth.accessToken, serverId.toString())
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          const transformed = resp.data.map((chnl: any) => ({
            id: chnl.channelId.toString(),
            name: chnl.channelName,
            description: chnl.description,
            serverId: chnl.serverId,
          }));
          setChannels(transformed);
        }
      })
      .catch(console.error);
  }, [auth, serverId]);

  // Subscribe to new channel events
  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    const sub = stomp.onChannelCreated(serverId.toString(), (event) => {
      if (event.channel) {
        setChannels((prev) => [...prev, event.channel]);
      }
    });
    return () => sub?.unsubscribe();
  }, [stomp, serverId]);

  // Helper to re-fetch channels
  const refetchChannels = () => {
    if (!auth?.accessToken) return;
    getChannels(auth.accessToken, serverId.toString())
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          const transformed = resp.data.map((chnl: any) => ({
            id: chnl.channelId.toString(),
            name: chnl.channelName,
            description: chnl.description,
            serverId: chnl.serverId,
          }));
          setChannels(transformed);
        }
      })
      .catch(console.error);
  };

  // Create a channel
  const handleCreateChannel = () => {
    if (!chName.trim()) return;
    stomp.createChannel(serverId.toString(), chName, chDesc);
    setChName("");
    setChDesc("");
    setShowCreateChannel(false);
    refetchChannels();
  };

  // Show/hide channel dropdown
  const toggleChannelMenu = (channelId: string) => {
    setOpenChannelMenu((prev) => (prev === channelId ? null : channelId));
  };

  // Edit channel
  const openEdit = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setShowEditModal(true);
    setOpenChannelMenu(null);
  };

  // Delete channel
  const openDelete = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setShowDeleteModal(true);
    setOpenChannelMenu(null);
  };

  return (
    <div className="w-56 bg-gray-900 p-3 flex flex-col text-white">
      {/** SERVER INFO */}
      {serverInfo && (
        <div className="flex items-center space-x-2 mb-4">
          <UserAvatar name={serverInfo.serverName} picture={serverInfo.avatarUrl} />
          <h2 className="text-lg font-bold">{serverInfo.serverName}</h2>
          {serverInfo.serverDescription && (
          <p className="text-sm text-gray-400 mt-1">{serverInfo.serverDescription}</p>
        )}
        </div>
      )}

      {/** CHANNELS HEADER + "+" BUTTON */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Channels</span>
        <button onClick={() => setShowCreateChannel(true)}>+</button>
      </div>

      {/** CHANNEL LIST */}
      <div className="space-y-2">
        {channels.map((ch) => (
          <div key={ch.id} className="relative flex items-center">
            {/** Click the channel name to select */}
            <button
              className="text-left flex-grow"
              onClick={() => onChannelSelect(parseInt(ch.id))}
            >
              <ChannelButton name={`#${ch.name}`} />
            </button>
            {/** Dropdown toggle */}
            <button
              onClick={() => toggleChannelMenu(ch.id)}
              className="text-sm text-gray-400 hover:text-white ml-2"
            >
              ⋮
            </button>
            {openChannelMenu === ch.id && (
              <div className="absolute right-0 top-full bg-gray-700 rounded shadow z-10 mt-1">
                <button
                  className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                  onClick={() => openEdit(ch)}
                >
                  Edit
                </button>
                <button
                  className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                  onClick={() => openDelete(ch)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/** CREATE CHANNEL MODAL */}
      {showCreateChannel && (
        <div className="absolute bg-gray-700 p-3 shadow rounded">
          <input
            className="p-1 text-black w-full"
            placeholder="Channel Name"
            value={chName}
            onChange={(e) => setChName(e.target.value)}
          />
          <textarea
            className="p-1 text-black mt-2 w-full"
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

      {/** EDIT CHANNEL MODAL */}
      {showEditModal && selectedChannel && (
        <EditChannelModal
          channelId={Number(selectedChannel.id)}
          currentName={selectedChannel.name}
          currentDesc={selectedChannel.description}
          onClose={() => setShowEditModal(false)}
          onSuccess={refetchChannels}
        />
      )}

      {/** DELETE CHANNEL CONFIRMATION */}
      {showDeleteModal && selectedChannel && (
        <DeleteChannelConfirmation
          channelId={Number(selectedChannel.id)}
          channelName={selectedChannel.name}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={refetchChannels}
        />
      )}
    </div>
  );
};

export default ChannelBar;
