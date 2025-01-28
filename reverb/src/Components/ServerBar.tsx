import React, { useEffect, useState } from "react";
import { ServerButton, IconButton } from "./IconLib";
import { getUserServers, joinServer, getAdminsByIds, editServer } from "../Api/axios"; 
import useAuth from "../Hooks/useAuth";
import { useStomp } from "../Hooks/useStomp";

import EditServerModal from "./EditServerModal";
import DeleteServerConfirmation from "./DeleteServerConfirmation";
import UpdateServerIcon from "./UpdateServerIcon";
import GrantAuthoritiesModal from "./GrantAuthoritiesModal"; // Our new modal

import { FaLink, FaPlus } from "react-icons/fa6";

interface ServerData {
  id: number;
  name: string;
  description?: string;
  serverIconUuid?: string;
  ownerId?: number; // to know who the owner is
}

interface ServerBarProps {
  onSelectServer?: (serverId: number) => void;
}

const ServerBar: React.FC<ServerBarProps> = ({ onSelectServer }) => {
  const stomp = useStomp();
  const { auth } = useAuth();

  const [servers, setServers] = useState<ServerData[]>([]);
  const [authorizedMap, setAuthorizedMap] = useState<{ [key: number]: number[] }>({});

  // CREATE / JOIN
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [joinServerName, setJoinServerName] = useState("");

  // EDIT / DELETE / ICON / GRANT
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showIconUploadModal, setShowIconUploadModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);

  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [openServerDropdown, setOpenServerDropdown] = useState<string | null>(null);

  const [refreshIconFlag, setRefreshIconFlag] = useState(0);

  // ---------------------------
  // 1) Fetch user servers
  // ---------------------------
  useEffect(() => {
    if (!auth?.accessToken) return;
    getUserServers(auth.accessToken, auth.userId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          const transformed = resp.data.map((srv: any) => ({
            id: srv.serverId,
            name: srv.serverName,
            description: srv.description,
            serverIconUuid: srv.serverIconUuid,
            ownerId: srv.ownerId, 
          }));
          setServers(transformed);
        }
      })
      .catch(console.error);
  }, [auth]);

  // ---------------------------
  // 2) For each server, fetch its authorized user IDs
  // ---------------------------
  useEffect(() => {
    if (!auth?.accessToken) return;
    if (servers.length === 0) return; // no servers yet

    const fetchAll = async () => {
      try {
        const newMap: { [key: number]: number[] } = {};
        for (const srv of servers) {
          // getAdminsByIds returns an array of userIds, presumably
          const resp = await getAdminsByIds(auth.accessToken, srv.id);
          if (Array.isArray(resp.data)) {
            newMap[srv.id] = resp.data;
          } else {
            newMap[srv.id] = [];
          }
        }
        setAuthorizedMap(newMap);
      } catch (error) {
        console.error("Error fetching authorized users:", error);
      }
    };

    fetchAll();
  }, [servers, auth]);

  // Subscribe to real-time “server created” events
  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    const sub = stomp.onServerCreated((event) => {
      // event: { id, name, description, serverIconUuid, ownerId? ... }
      const newServer: ServerData = {
        id: Number(event.id),
        name: event.name || "Unnamed Server",
        description: event.description,
        serverIconUuid: event.serverIconUuid
      };
      setServers((prev) => [...prev, newServer]);
    });

    const editSub = stomp.onServerEditedSignal((data) => {
      console.log("Server edited signal received:", data);
      refetchServers();
     
      setRefreshIconFlag((prev) => prev + 1);
    });
    return () => {
      sub?.unsubscribe();
      editSub?.unsubscribe();
    }

  }, [stomp]);


  // Helper to re-fetch servers & authorized users
  const refetchServers = () => {
    if (!auth?.accessToken) return;
    getUserServers(auth.accessToken, auth.userId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          const transformed = resp.data.map((srv: any) => ({
            id: srv.serverId,
            name: srv.serverName,
            description: srv.description,
            serverIconUuid: srv.serverIconUuid,
            ownerId: srv.ownerId,
          }));
          setServers(transformed);
          setRefreshIconFlag((prev) => prev + 1);
        }
      })
      .catch(console.error);
    // After we re-fetch servers, useEffect for "servers" 
    // will again fetch authorizedMap. 
  };

  // CREATE server
  const handleCreateServer = () => {
    if (!newName.trim()) return;
    // STOMP creation => new server
    stomp.createServer(newName, auth.userId, newDesc);
    setNewName("");
    setNewDesc("");
    setShowCreateServer(false);
    refetchServers();
  };



  // JOIN server
  const handleJoinServer = () => {
    if (!joinServerName.trim()) return;
    joinServer(auth.accessToken, joinServerName, auth.userId)
      .then(() => {
        setJoinServerName("");
        setShowJoinServer(false);
        refetchServers();
      })
      .catch(console.error);
  };

  // EDIT server
  const handleOpenEdit = (server: ServerData) => {
    setSelectedServer(server);
    setShowEditModal(true);
    setOpenServerDropdown(null);
  };

  // CHANGE ICON
  const handleIconUpload = (server: ServerData) => {
    setSelectedServer(server);
    setShowIconUploadModal(true);
    setOpenServerDropdown(null);
  };

  // DELETE server
  const handleOpenDelete = (server: ServerData) => {
    setSelectedServer(server);
    setShowDeleteModal(true);
    setOpenServerDropdown(null);
  };

  // GRANT authorities
  const handleOpenGrant = (server: ServerData) => {
    setSelectedServer(server);
    setShowGrantModal(true);
    setOpenServerDropdown(null);
  };

  // Toggle which server's dropdown is open
  const toggleServerDropdown = (serverId: string) => {
    setOpenServerDropdown((prev) => (prev === serverId ? null : serverId));
  };

  return (
    <div
      className="flex flex-col items-center bg-gray-900 border-y border-gray-700 p-2"
      style={{ width: "4.5rem" }}
    >
      {servers.map((srv) => {
        // Determine if current user is the owner
        const isOwner = srv.ownerId === auth.userId;

        // Determine if user is in the authorized list for this server
        const userIds = authorizedMap[srv.id] || [];
        const isAuthorized = userIds.includes(auth.userId);

        // If user is owner or authorized, can do Edit & Icon changes
        const canEdit = isOwner || isAuthorized;

        return (
          <div key={srv.id} className="relative mb-2">
            <button
              onClick={() => onSelectServer?.(srv.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleServerDropdown(srv.id.toString());
              }}
            >
              <ServerButton name={srv.name} picture={srv.serverIconUuid} refreshflag={refreshIconFlag}  />
            </button>

            {/* Dropdown for various actions */}
            {openServerDropdown === srv.id.toString() && (
              <div className="absolute left-full top-0 ml-2 bg-gray-700 rounded shadow z-10 mt-1">
                {/* If Owner => can do Grant & Delete */}
                {isOwner && (
                  <>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                      onClick={() => handleOpenGrant(srv)}
                    >
                      Grant Authorities
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-red-500"
                      onClick={() => handleOpenDelete(srv)}
                    >
                      Delete
                    </button>
                  </>
                )}

                {/* If Owner or Authorized => can do Edit & Icon */}
                {canEdit && (
                  <>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                      onClick={() => handleOpenEdit(srv)}
                    >
                      Edit
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                      onClick={() => handleIconUpload(srv)}
                    >
                      Change Icon
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* “Create Server” button */}
      <div onClick={() => setShowCreateServer(true)}>
        <IconButton icon={<FaPlus size="17" />} name="Create Server" />
      </div>

      {/* “Join Server” button */}
      <div onClick={() => setShowJoinServer(true)}>
        <IconButton icon={<FaLink size="18" />} name="Join Server" />
      </div>

      {/* CREATE SERVER MODAL */}
      {showCreateServer && (
        <div className="absolute right-20 top-20 bg-gray-700 p-4 rounded shadow">
          <h3 className="text-lg font-bold">Create Server</h3>
          <input
            className="mt-2 p-1 text-black block"
            placeholder="Server Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <textarea
            className="mt-2 p-1 text-black block"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <button className="bg-blue-500 p-1 mt-2" onClick={handleCreateServer}>
            Create
          </button>
          <button
            className="bg-gray-500 p-1 ml-2"
            onClick={() => setShowCreateServer(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* JOIN SERVER MODAL */}
      {showJoinServer && (
        <div className="absolute right-20 top-20 bg-gray-700 p-4 rounded shadow">
          <h3 className="text-lg font-bold">Join Server</h3>
          <input
            className="mt-2 p-1 text-black block"
            placeholder="Server Name"
            value={joinServerName}
            onChange={(e) => setJoinServerName(e.target.value)}
          />
          <button className="bg-green-500 p-1 mt-2" onClick={handleJoinServer}>
            Join
          </button>
          <button
            className="bg-gray-500 p-1 ml-2"
            onClick={() => setShowJoinServer(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* EDIT SERVER MODAL */}
      {showEditModal && selectedServer && (
        <EditServerModal
          serverId={selectedServer.id}
          currentName={selectedServer.name}
          currentDesc={selectedServer.description}
          onClose={() => setShowEditModal(false)}
          onSuccess={refetchServers}
        />
      )}

      {/* UPLOAD SERVER ICON MODAL */}
      {showIconUploadModal && selectedServer && (
        <UpdateServerIcon
          serverId={selectedServer.id}
          onClose={() => setShowIconUploadModal(false)}
          onUploadSuccess={refetchServers}
        />
      )}

      {/* DELETE SERVER CONFIRMATION */}
      {showDeleteModal && selectedServer && (
        <DeleteServerConfirmation
          serverId={selectedServer.id}
          serverName={selectedServer.name}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={refetchServers}
        />
      )}

      {/* GRANT AUTHORITIES MODAL */}
      {showGrantModal && selectedServer && (
        <GrantAuthoritiesModal
          serverId={selectedServer.id}
          onClose={() => setShowGrantModal(false)}
          onGranted={refetchServers}
        />
      )}
    </div>
  );
};

export default ServerBar;
