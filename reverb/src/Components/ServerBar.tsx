import React, { useEffect, useState, useRef } from "react";
import { ServerButton, IconButton } from "./IconLib";
import { getUserServers, getAdminsByIds } from "../Api/axios"; 
import useAuth from "../Hooks/useAuth";
import { useStomp } from "../Hooks/useStomp";

import EditServerModal from "./Modals/EditServerModal";
import DeleteServerConfirmation from "./Modals/DeleteServerConfirmation";
import UpdateServerIcon from "./Modals/UpdateServerIcon";
import GrantAuthoritiesModal from "./Modals/GrantAuthoritiesModal";

import CreateServerModal from "./Modals/CreateServerModal"; // New import
import JoinServerModal from "./Modals/JoinServerModal"; // New import

import { FaLink, FaPlus } from "react-icons/fa6";

import ServerDropdown from "./ServerDropdown"; // Import the new Dropdown component

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
  const [showJoinServer, setShowJoinServer] = useState(false);

  // EDIT / DELETE / ICON / GRANT
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showIconUploadModal, setShowIconUploadModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);

  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);

  const [dropdownState, setDropdownState] = useState<{
    server: ServerData;
    position: { top: number; left: number };
  } | null>(null);

  const [refreshIconFlag, setRefreshIconFlag] = useState(0);

  // Ref to store the button elements for positioning the dropdown
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

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

  // Subscribe to real-time “server edited” events
  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    
    const editSub = stomp.onServerEditedSignal((data) => {
      console.log("Server edited signal received:", data);
      refetchServers();
     
      setRefreshIconFlag((prev) => prev + 1);
    });
    return () => {
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

  // EDIT server
  const handleOpenEdit = (server: ServerData) => {
    console.log("handleOpenEdit called with", server);
    setSelectedServer(server);
    setShowEditModal(true);
  };

  // CHANGE ICON
  const handleIconUpload = (server: ServerData) => {
    console.log("handleIconUpload called with", server);
    setSelectedServer(server);
    setShowIconUploadModal(true);
  };

  // DELETE server
  const handleOpenDelete = (server: ServerData) => {
    console.log("handleOpenDelete called with", server);
    setSelectedServer(server);
    setShowDeleteModal(true);
  };

  // GRANT authorities
  const handleOpenGrant = (server: ServerData) => {
    console.log("handleOpenGrant called with", server);
    setSelectedServer(server);
    setShowGrantModal(true);
  };

  // Toggle which server's dropdown is open
  const toggleServerDropdown = (server: ServerData, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent default context menu
    if (dropdownState && dropdownState.server.id === server.id) {
      setDropdownState(null); // Close if already open
    } else {
      // Get the button's position
      const button = buttonRefs.current[server.id];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownState({
          server,
          position: {
            top: rect.top + window.scrollY,
            left: rect.right + window.scrollX,
          },
        });
      }
    }
  };

  // Handle closing the dropdown
  const handleCloseDropdown = () => {
    console.log("handleCloseDropdown called");
    setDropdownState(null);
  };

  return (
    <div
      className="relative flex flex-col items-center bg-gray-900 border-y border-gray-700 p-2"
      style={{ width: "4.5rem" }}
    >
      {/* Scrollable Server List */}
      <div className="flex-1 w-full overflow-y-scroll overflow-x-visible mb-4 pr-2">
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
                ref={(el) => (buttonRefs.current[srv.id] = el)}
                onClick={() => {
                  console.log(`Server ${srv.name} selected`);
                  onSelectServer?.(srv.id);
                }}
                onContextMenu={(e) => toggleServerDropdown(srv, e)}
              >
                <ServerButton name={srv.name} picture={srv.serverIconUuid} refreshflag={refreshIconFlag}  />
              </button>
            </div>
          );
        })}
      </div>

      {/* Dropdown for the selected server */}
      {dropdownState && (
        <ServerDropdown
          server={dropdownState.server}
          position={dropdownState.position}
          onClose={handleCloseDropdown}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onChangeIcon={handleIconUpload}
          onGrantAuthorities={handleOpenGrant}
          canEdit={
            dropdownState.server.ownerId === auth.userId ||
            (authorizedMap[dropdownState.server.id] || []).includes(auth.userId)
          }
          isOwner={dropdownState.server.ownerId === auth.userId}
        />
      )}

      {/* “Create Server” button */}
      <div onClick={() => setShowCreateServer(true)} className="mt-2">
        <IconButton icon={<FaPlus size="17" />} name="Create Server" />
      </div>

      {/* “Join Server” button */}
      <div onClick={() => setShowJoinServer(true)} className="mt-2">
        <IconButton icon={<FaLink size="18" />} name="Join Server" />
      </div>

      {/* CREATE SERVER MODAL */}
      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onSuccess={refetchServers}
        />
      )}

      {/* JOIN SERVER MODAL */}
      {showJoinServer && (
        <JoinServerModal
          onClose={() => setShowJoinServer(false)}
          onSuccess={refetchServers}
        />
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
