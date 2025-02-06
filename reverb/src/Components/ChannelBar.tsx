// src/Components/ChannelBar.tsx

import React, { useEffect, useState } from "react";
import { ChannelButton, ServerIcon } from "./IconLib";
import { useStompContext } from "../Hooks/useStompContext";
import useAuth from "../Hooks/useAuth";
import { getChannels, getServer, getAdminsByIds } from "../Api/axios";
import EditChannelModal from "./Modals/EditChannelModal";
import DeleteChannelConfirmation from "./Modals/DeleteChannelConfirmation";
import CreateChannelModal from "./Modals/CreateChannelModal";
import { FaPlus, FaEllipsisVertical } from "react-icons/fa6";

interface ServerInfo {
  serverId: number;
  serverName: string;
  serverDescription?: string;
  serverIconUuid?: string;
  ownerId: number;
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

  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  const [authorizedUserIds, setAuthorizedUserIds] = useState<number[]>([]);

  const [channels, setChannels] = useState<ChannelData[]>([]);
  
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  const [openChannelMenu, setOpenChannelMenu] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [refreshIconFlag, setRefreshIconFlag] = useState(0);

  //Fetch server info
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
    const subEditServer = stomp.onServerEditedSignal((data) => {
      //console.log("Received server.edited signal:", data);
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
      //console.log("Received server.deleted signal:", data);
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

    const subDeleteChannel = stomp.onChannelDeletedSignal((data) => {
      //console.log("Received channel.deleted signal:", data);
      refetchChannels();
    });
    
    const subEditChannel = stomp.onChannelEditedSignal((data) => {
      //console.log("Received channel.edited signal:", data);
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
  }, [stomp, serverId, auth]);


  //Fetch authorized users
  useEffect(() => {
    if (!auth?.accessToken) return;
    if (!serverInfo) return;
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


  //Fetch channels
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

  //STOMP subscription for channel creation
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


  const isOwner = serverInfo?.ownerId === auth.userId;
  const isAuthorized = isOwner || (authorizedUserIds.includes(auth.userId));


  const toggleChannelMenu = (channelId: string) => {
    setOpenChannelMenu((prev) => (prev === channelId ? null : channelId));
  };

  const openEdit = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setShowEditModal(true);
    setOpenChannelMenu(null);
  };

  const openDelete = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setShowDeleteModal(true);
    setOpenChannelMenu(null);
  };

  return (
    <div className="w-56 bg-gray-900 border-l border-y border-gray-700 p-3 flex flex-col text-white">
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
      <div className="flex items-center justify-between mb-2 border-b border-gray-700 pb-2">
        <span className="text-sm font-semibold">Channels</span>
        {/*Only show "+" if user is authorized or owner*/}
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
      <div className="flex-1 overflow-y-auto mb-4 scrollbar-gutter-stable pr-2">
      <div className="space-y-2">
        {channels.map((ch) => {
          return (
            <div key={ch.id} className="relative flex items-center">
              <button
                className="text-left flex-grow"
                onClick={() => onChannelSelect(parseInt(ch.id))}
              >
                <ChannelButton name={`#${ch.name}`} />
              </button>
              {/*If user is authorized show dropdown toggle*/}
              {isAuthorized && (
                <button
                  onClick={() => toggleChannelMenu(ch.id)}
                  className="text-sm text-gray-400 hover:text-yellow-500 ml-2"
                >
                  <FaEllipsisVertical size={15}/>
                </button>
              )}
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
      </div>
      {/*create channel*/}
      {showCreateChannel && (
        <CreateChannelModal
          serverId={serverId}
          onClose={() => setShowCreateChannel(false)}
          onSuccess={refetchChannels}
        />
      )}

      {/*edit channel*/}
      {showEditModal && selectedChannel && (
        <EditChannelModal
          channelId={Number(selectedChannel.id)}
          currentName={selectedChannel.name}
          currentDesc={selectedChannel.description}
          onClose={() => setShowEditModal(false)}
          onSuccess={refetchChannels}
        />
      )}

      {/*delete channel*/}
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
