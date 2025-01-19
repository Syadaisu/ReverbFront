// src/Components/ChannelBar.tsx
import React, { useEffect, useState } from "react";
import { ChannelButton } from "./IconLib";
import { useStompContext } from "../Hooks/useStompContext";
import useAuth from "../Hooks/useAuth";
import { getChannels } from "../Api/axios";
import EditChannelModal from "./EditChannelModal";
import DeleteChannelConfirmation from "./DeleteChannelConfirmation";

interface ChannelData {
  id: string;
  name: string;
  description?: string;
  serverId: string;
}

interface ChannelBarProps {
  serverId: string;
  onChannelSelect: (channelId: number) => void; // <--- NEW
}

const ChannelBar: React.FC<ChannelBarProps> = ({ serverId, onChannelSelect }) => {
  const { auth } = useAuth();
  const stomp = useStompContext();
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [chName, setChName] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  //Subscribe to new channels for this server
  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    const sub = stomp.onChannelCreated(serverId, (event) => {
      //event.channel => { id, name, description, serverId }
      setChannels((prev) => [...prev, event.channel]);
    });
    return () => sub?.unsubscribe();
  }, [stomp, serverId]);

  // Initially, fetch existing channels from your REST API
  // For brevity, we skip that. We'll have an empty array plus new ones.

  useEffect(() => {
    console.log("useEffect for fetching servers triggered");
    console.log("Auth object:", auth);
    if (!auth?.accessToken) {
      console.log("No auth.token, skipping fetch");
      return;
    }
      
      
      getChannels(auth.accessToken, serverId)
        .then((resp) => {
          console.log("Channels loaded:", resp.data);
  
          if (!Array.isArray(resp.data)) {
            console.error("Expected resp.data to be an array, but it's not:", resp.data);
            return;
          }
          // Transform the response data to match ServerData interface
          const transformedChannels: ChannelData [] = resp.data.map((chnl: any) => {
            if (!chnl.channelId) {
              console.warn("Incomplete chnl data:", chnl);
              return null; // or handle as per your requirement
            }
  
            return {
              id: chnl.channelId.toString(),           
              name: chnl.channelName,           
              description: chnl.description,    
              serverId: chnl.serverId, 
            };
          }).filter((chnl: ChannelData | null) => chnl !== null) as ChannelData[]; // Remove nulls
          
  
          console.log("Transformed channels:", transformedChannels);
          setChannels(transformedChannels);
        })
        .catch((error) => {
          console.error("Failed to load channels", error);
        });
    }, [auth, serverId]);
  
  
    const openEdit = (channel: ChannelData) => {
      setSelectedChannel(channel);
      setShowEditModal(true);
    };
  
    const openDelete = (channel: ChannelData) => {
      setSelectedChannel(channel);
      setShowDeleteModal(true);
    };

  const refetchChannels = () => {
    getChannels(auth.accessToken, serverId)
        .then((resp) => {
          console.log("Channels loaded:", resp.data);
  
          if (!Array.isArray(resp.data)) {
            console.error("Expected resp.data to be an array, but it's not:", resp.data);
            return;
          }
          // Transform the response data to match ServerData interface
          const transformedChannels: ChannelData [] = resp.data.map((chnl: any) => {
            if (!chnl.channelId) {
              console.warn("Incomplete chnl data:", chnl);
              return null; // or handle as per your requirement
            }
  
            return {
              id: chnl.channelId.toString(),           
              name: chnl.channelName,           
              description: chnl.description,    
              serverId: chnl.serverId, 
            };
          }).filter((chnl: ChannelData | null) => chnl !== null) as ChannelData[]; // Remove nulls
          
  
          console.log("Transformed channels:", transformedChannels);
          setChannels(transformedChannels);
        })
        .catch((error) => {
          console.error("Failed to load channels", error);
        });
      }

  const handleCreateChannel = () => {
    if (!chName) {
      console.log("Channel Name is empty. Aborting creation.");
      return;
    }
    console.log("Creating server with Name:", chName, "Description:", chDesc, "Server ID:", serverId);
    stomp.createChannel(serverId, chName, chDesc);
    setChName("");
    setChDesc("");
    setShowCreateChannel(false);
    refetchChannels();
  };

  return (
    <div className="w-56 bg-gray-900 p-3 flex flex-col text-white">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">Channels</h2>
        <button onClick={() => setShowCreateChannel(true)}>+</button>
      </div>
      <div className="space-y-2">
      {channels.map((ch) => (
          <div key={ch.id} className="flex items-center justify-between">
            <ChannelButton name={`#${ch.name}`} />
            <div className="flex space-x-1">
              <button
                className="bg-blue-600 text-white px-2 py-1 rounded"
                onClick={() => openEdit(ch)}
              >
                E
              </button>
              <button
                className="bg-red-600 text-white px-2 py-1 rounded"
                onClick={() => openDelete(ch)}
              >
                D
              </button>
            </div>
          </div>
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
      {/* Edit Channel Modal */}
      {showEditModal && selectedChannel && (
        <EditChannelModal
          channelId={Number(selectedChannel.id)}
          currentName={selectedChannel.name}
          currentDesc={selectedChannel.description}
          onClose={() => setShowEditModal(false)}
          onSuccess={refetchChannels}
        />
      )}

      {/* Delete Channel Confirmation */}
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
