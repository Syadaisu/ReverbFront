import React, { useEffect, useState } from "react";
import { ChannelButton, ServerIcon } from "./IconLib";
import { useStompContext } from "../Hooks/useStompContext";
import useAuth from "../Hooks/useAuth";
import { getChannels, getServer, getAdminsByIds } from "../Api/axios";
import EditChannelModal from "./EditChannelModal";
import DeleteChannelConfirmation from "./DeleteChannelConfirmation";
import { FaPlus, FaEllipsisVertical } from "react-icons/fa6";
import { get } from "http";

// Example type: adapt to your actual server-info shape
interface ServerInfo {
  serverId: number;
  serverName: string;
  serverDescription?: string;
  serverIconUuid?: string;  // If you store an avatar for the server
  ownerId: number;          // The server's owner ID
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

  // Store server info for name/avatar/owner
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  // Store the list of authorized user IDs
  const [authorizedUserIds, setAuthorizedUserIds] = useState<number[]>([]);

  // Channels array
  const [channels, setChannels] = useState<ChannelData[]>([]);
  
  // Modal states
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [chName, setChName] = useState("");
  const [chDesc, setChDesc] = useState("");

  // Channel dropdown logic
  const [openChannelMenu, setOpenChannelMenu] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [refreshIconFlag, setRefreshIconFlag] = useState(0);

  // ---------------------------
  // Fetch server info
  // ---------------------------
  useEffect(() => {
    if (!auth?.accessToken) return;
    getServer(auth.accessToken, serverId)
      .then((resp) => {
        if (resp.data) {
          setServerInfo({
            serverId,
            serverName: resp.data.serverName,
            serverDescription: resp.data.description,
            serverIconUuid: resp.data.serverIconUuid,
            ownerId: resp.data.ownerId,
          });
        }
      })
      .catch(console.error);
  }, [serverId, auth]);


  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    
    // For minimal "server edited" signal
    const subEditServer = stomp.onServerEditedSignal((data) => {
      console.log("Received server.edited signal:", data);
      getServer(auth.accessToken, serverId)
      .then((resp) => {
        if (resp.data) {
          setServerInfo({
            serverId,
            serverName: resp.data.serverName,
            serverDescription: resp.data.description,
            serverIconUuid: resp.data.serverIconUuid,
            ownerId: resp.data.ownerId,
          });
          setRefreshIconFlag((prev) => prev + 1);
        }
      })
    });
    
    const subDeleteServer = stomp.onServerDeletedSignal((data) => {
      console.log("Received server.deleted signal:", data);
      // Route to home or show a message
      getServer(auth.accessToken, serverId)
      .then((resp) => {
        if (resp.data) {
          setServerInfo({
            serverId,
            serverName: resp.data.serverName,
            serverDescription: resp.data.description,
            serverIconUuid: resp.data.serverIconUuid,
            ownerId: resp.data.ownerId,
          });
        }
      })

    });

    
    // For minimal "channel deleted" signal
    const subDeleteChannel = stomp.onChannelDeletedSignal((data) => {
      console.log("Received channel.deleted signal:", data);
      refetchChannels();
    });
    
    const subEditChannel = stomp.onChannelEditedSignal((data) => {
      console.log("Received channel.edited signal:", data);
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
    });
    return () => {
      subDeleteServer?.unsubscribe();
      subEditServer?.unsubscribe();
      subDeleteChannel?.unsubscribe();
      subEditChannel?.unsubscribe();
    };
  }, [stomp]);

  // ---------------------------
  // Fetch server admins (authorized users)
  // ---------------------------
  useEffect(() => {
    if (!auth?.accessToken) return;
    if (!serverInfo) return; // Wait until we have server info
    // Suppose your method is getAdminsByIds(token, serverId) 
    getAdminsByIds(auth.accessToken, serverId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          setAuthorizedUserIds(resp.data as number[]);
        } else {
          setAuthorizedUserIds([]);
        }
      })
      .catch(console.error);
  }, [auth, serverId, serverInfo]);

  // ---------------------------
  // Fetch channels
  // ---------------------------
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

  // ---------------------------
  // STOMP subscription for channel creation
  // ---------------------------
  useEffect(() => {
    if (!stomp || !stomp.connected || !serverId) return;
    const sub = stomp.onChannelCreated(serverId.toString(), (channel) => {
      if (channel) {
        const newChannel = {
          id: channel.channelId.toString(),
          name: channel.channelName,
          description: channel.description,
          serverId: serverId.toString()
        };
        setChannels((prev) => [...prev, newChannel]);
      }
    });
    return () => sub?.unsubscribe();
  }, [stomp, serverId]);

  // Helper: re-fetch channels
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

  // ---------------------------
  // Permission checks
  // ---------------------------
  const isOwner = serverInfo?.ownerId === auth.userId;
  // If the user is in authorizedUserIds or is the owner
  const isAuthorized = isOwner || (authorizedUserIds.includes(auth.userId));

  // ---------------------------
  // Creating a channel
  // ---------------------------
  const handleCreateChannel = () => {
    if (!chName.trim()) return;
    // Using STOMP
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

  // Edit channel (owner or admin)
  const openEdit = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setShowEditModal(true);
    setOpenChannelMenu(null);
  };

  // Delete channel (owner only)
  const openDelete = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setShowDeleteModal(true);
    setOpenChannelMenu(null);
  };

  return (
    <div className="w-56 bg-gray-900 border-l border-y border-gray-700 p-3 flex flex-col text-white">
      {/* SERVER INFO */}
      {serverInfo && (
        <div className="flex flex-col mb-4">
          <div className="flex items-center space-x-2">
            <ServerIcon name={serverInfo.serverName} picture={serverInfo.serverIconUuid} refreshflag={refreshIconFlag} />
            <h2 className="text-lg font-bold">{serverInfo.serverName}</h2>
          </div>
          {serverInfo.serverDescription && (
            <p className="text-sm text-gray-400 mt-1">{serverInfo.serverDescription}</p>
          )}
        </div>
      )}

      {/* CHANNELS HEADER */}
      <div className="flex items-center justify-between mb-2 border-b border-gray-700 pb-2">
        <span className="text-sm font-semibold">Channels</span>
        {/* Only show "+" if user is authorized or owner */}
        {isAuthorized && (
          <button
            onClick={() => setShowCreateChannel(true)}
            className="text-xl font-bold hover:text-yellow-500"
            aria-label="Add Channel"
          >
            <FaPlus size={13}/>
          </button>
        )}
      </div>

      {/* CHANNEL LIST */}
      <div className="space-y-2">
        {channels.map((ch) => {
          return (
            <div key={ch.id} className="relative flex items-center">
              {/* Click the channel name to select */}
              <button
                className="text-left flex-grow"
                onClick={() => onChannelSelect(parseInt(ch.id))}
              >
                <ChannelButton name={`#${ch.name}`} />
              </button>
              {/* If user can at least edit channel => show dropdown toggle */}
              {isAuthorized && (
                <button
                  onClick={() => toggleChannelMenu(ch.id)}
                  className="text-sm text-gray-400 hover:text-yellow-500 ml-2"
                >
                  <FaEllipsisVertical size={15}/>
                </button>
              )}
              {/* Channel dropdown: "Edit" if authorized, "Delete" if owner */}
              {openChannelMenu === ch.id && (
                <div className="absolute right-0 top-full bg-gray-700 rounded shadow z-10 mt-1">
                  {isAuthorized && (
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-gray-600"
                      onClick={() => openEdit(ch)}
                    >
                      Edit
                    </button>
                  )}
                  {isOwner && (
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-red-500"
                      onClick={() => openDelete(ch)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CREATE CHANNEL MODAL */}
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

      {/* EDIT CHANNEL MODAL */}
      {showEditModal && selectedChannel && (
        <EditChannelModal
          channelId={Number(selectedChannel.id)}
          currentName={selectedChannel.name}
          currentDesc={selectedChannel.description}
          onClose={() => setShowEditModal(false)}
          onSuccess={refetchChannels}
        />
      )}

      {/* DELETE CHANNEL CONFIRMATION */}
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
