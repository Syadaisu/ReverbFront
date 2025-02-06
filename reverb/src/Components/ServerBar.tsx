import React, { useEffect, useState, useRef } from "react";
import { ServerButton, IconButton } from "./IconLib";
import { getUserServers, getAdminsByIds } from "../Api/axios"; 
import useAuth from "../Hooks/useAuth";
import { useStomp } from "../Hooks/useStomp";

import EditServerModal from "./Modals/EditServerModal";
import DeleteServerConfirmation from "./Modals/DeleteServerConfirmation";
import LeaveServerConfirmation from "./Modals/LeaveServerConfirmation";
import UpdateServerIcon from "./Modals/UpdateServerIcon";
import AuthoritiesModal from "./Modals/AuthoritiesModal";

import CreateServerModal from "./Modals/CreateServerModal";
import JoinServerModal from "./Modals/JoinServerModal";

import { FaLink, FaPlus } from "react-icons/fa6";

import ServerDropdown from "./ServerDropdown";

interface ServerData {
  id: number;
  name: string;
  description?: string;
  serverIconUuid?: string;
  ownerId?: number;
}

interface ServerBarProps {
  onSelectServer?: (serverId: number) => void;
}

const ServerBar: React.FC<ServerBarProps> = ({ onSelectServer }) => {
  const stomp = useStomp();
  const { auth } = useAuth();

  const [servers, setServers] = useState<ServerData[]>([]);
  const [authorizedMap, setAuthorizedMap] = useState<{ [key: number]: number[] }>({});

  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showIconUploadModal, setShowIconUploadModal] = useState(false);
  const [showAuthoritiesModal, setShowAuthoritiesModal] = useState(false);

  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);

  const [dropdownState, setDropdownState] = useState<{
    server: ServerData;
    position: { top: number; left: number };
  } | null>(null);

  const [refreshIconFlag, setRefreshIconFlag] = useState(0);

  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  //Fetch user servers
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

  //Fetch authorized users for each server
  useEffect(() => {
    if (!auth?.accessToken) return;
    if (servers.length === 0) return;

    const fetchAll = async () => {
      try {
        const newMap: { [key: number]: number[] } = {};
        for (const srv of servers) {
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

  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    
    const editSub = stomp.onServerEditedSignal((data) => {
      //console.log("Server edited signal received:", data);
      refetchServers();
     
      setRefreshIconFlag((prev) => prev + 1);
    });
    return () => {
      editSub?.unsubscribe();
    }

  }, [stomp]);

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
  };

  const handleOpenEdit = (server: ServerData) => {
    //console.log("handleOpenEdit called with", server);
    setSelectedServer(server);
    setShowEditModal(true);
  };

  const handleIconUpload = (server: ServerData) => {
    //console.log("handleIconUpload called with", server);
    setSelectedServer(server);
    setShowIconUploadModal(true);
  };

  const handleOpenDelete = (server: ServerData) => {
    //console.log("handleOpenDelete called with", server);
    setSelectedServer(server);
    setShowDeleteModal(true);
  };

  const handleOpenAuthorities = (server: ServerData) => {
    //console.log("handleOpenAuthorities called with", server);
    setSelectedServer(server);
    setShowAuthoritiesModal(true);
  };

  const handleLeaveServer = (server: ServerData) => {
    //console.log("handleLeaveServer called with", server);
    setSelectedServer(server);
    setShowLeaveModal(true);
  };

  const toggleServerDropdown = (server: ServerData, event: React.MouseEvent) => {
    event.preventDefault();
    if (dropdownState && dropdownState.server.id === server.id) {
      setDropdownState(null);
    } else {
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

  const handleCloseDropdown = () => {
    //console.log("handleCloseDropdown called");
    setDropdownState(null);
  };

  return (
    <div
      className="relative flex flex-col items-center bg-gray-900 border-y border-gray-700 p-2"
      style={{ width: "4.5rem" }}
    >
      <div className="flex-1 w-full overflow-y-scroll mb-4 pr-2">
        {servers.map((srv) => {
          const isOwner = srv.ownerId === auth.userId;

          const userIds = authorizedMap[srv.id] || [];
          const isAuthorized = userIds.includes(auth.userId);

          const canEdit = isOwner || isAuthorized;
          
          return (
            <div key={srv.id} className="relative mb-2">
              <button
                ref={(el) => (buttonRefs.current[srv.id] = el)}
                onClick={() => {
                  //console.log(`Server ${srv.name} selected`);
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

      {dropdownState && (
        <ServerDropdown
          server={dropdownState.server}
          position={dropdownState.position}
          onClose={handleCloseDropdown}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onChangeIcon={handleIconUpload}
          onAuthorities={handleOpenAuthorities}
          onLeaveServer={handleLeaveServer}
          canEdit={
            dropdownState.server.ownerId === auth.userId ||
            (authorizedMap[dropdownState.server.id] || []).includes(auth.userId)
          }
          isOwner={dropdownState.server.ownerId === auth.userId}
        />
      )}

      <div onClick={() => setShowCreateServer(true)} className="mt-2">
        <IconButton icon={<FaPlus size="17" />} name="Create Server" />
      </div>
      
      <div onClick={() => setShowJoinServer(true)} className="mt-2">
        <IconButton icon={<FaLink size="18" />} name="Join Server" />
      </div>

      {/*create server*/}
      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onSuccess={refetchServers}
        />
      )}

      {/*join server*/}
      {showJoinServer && (
        <JoinServerModal
          onClose={() => setShowJoinServer(false)}
          onSuccess={refetchServers}
        />
      )}

      {/*edit server*/}
      {showEditModal && selectedServer && (
        <EditServerModal
          serverId={selectedServer.id}
          currentName={selectedServer.name}
          currentDesc={selectedServer.description}
          onClose={() => setShowEditModal(false)}
          onSuccess={refetchServers}
        />
      )}

      {/*upload server icon*/}
      {showIconUploadModal && selectedServer && (
        <UpdateServerIcon
          serverId={selectedServer.id}
          onClose={() => setShowIconUploadModal(false)}
          onUploadSuccess={refetchServers}
        />
      )}

      {/*delete server*/}
      {showDeleteModal && selectedServer && (
        <DeleteServerConfirmation
          serverId={selectedServer.id}
          serverName={selectedServer.name}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={refetchServers}
        />
      )}

      {/*leave server*/}
      {showLeaveModal && selectedServer && (
        <LeaveServerConfirmation
          serverId={selectedServer.id}
          serverName={selectedServer.name}
          onClose={() => setShowLeaveModal(false)}
          onLeft={refetchServers}
        />
      )}

      {/*authorities*/}
      {showAuthoritiesModal && selectedServer && (
        <AuthoritiesModal
          serverId={selectedServer.id}
          serverName={selectedServer.name}
          onClose={() => setShowAuthoritiesModal(false)}
          onAuthorities={refetchServers}
        />
      )}
    </div>
  );
};

export default ServerBar;
