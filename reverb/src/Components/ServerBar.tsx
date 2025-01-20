import React, { useEffect, useState } from "react";
import { ServerButton, IconButton } from "./IconLib";
import { getUserServers, joinServer } from "../Api/axios";
import useAuth from "../Hooks/useAuth";
import { useStomp } from "../Hooks/useStomp";
import EditServerModal from "./EditServerModal";
import DeleteServerConfirmation from "./DeleteServerConfirmation";

interface ServerData {
  id: number;
  name: string;
  description?: string;
}

interface ServerBarProps {
  onSelectServer?: (serverId: number) => void;
}

const ServerBar: React.FC<ServerBarProps> = ({ onSelectServer }) => {
  const stomp = useStomp();
  const { auth } = useAuth();
  const [servers, setServers] = useState<ServerData[]>([]);

  // “Create” / “Join” server modals
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [joinServerName, setJoinServerName] = useState("");

  // “Edit” / “Delete” modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);

  // Dropdown state (which server is toggled)
  const [openServerDropdown, setOpenServerDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) return;
    getUserServers(auth.accessToken, auth.userId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          const transformed = resp.data.map((srv: any) => ({
            id: srv.serverId.toString(),
            name: srv.serverName,
            description: srv.description,
          }));
          setServers(transformed);
        }
      })
      .catch(console.error);
  }, [auth]);

  // Subscribe to real-time “server created” events
  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    const sub = stomp.onServerCreated((event) => {
      const newServer: ServerData = {
        id: Number(event.id),
        name: event.name || "Unnamed Server",
        description: event.description,
      };
      setServers((prev) => [...prev, newServer]);
    });
    return () => {
      sub?.unsubscribe();
    };
  }, [stomp]);

  // Refetch servers after create/join/edit/delete
  const refetchServers = () => {
    if (!auth?.accessToken) return;
    getUserServers(auth.accessToken, auth.userId)
      .then((resp) => {
        if (Array.isArray(resp.data)) {
          const transformed = resp.data.map((srv: any) => ({
            id: srv.serverId.toString(),
            name: srv.serverName,
            description: srv.description,
          }));
          setServers(transformed);
        }
      })
      .catch(console.error);
  };

  // CREATE server
  const handleCreateServer = () => {
    if (!newName.trim()) return;
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

  // DELETE server
  const handleOpenDelete = (server: ServerData) => {
    setSelectedServer(server);
    setShowDeleteModal(true);
    setOpenServerDropdown(null);
  };

  // Toggle which server's dropdown is open
  const toggleServerDropdown = (serverId: string) => {
    setOpenServerDropdown((prev) => (prev === serverId ? null : serverId));
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 p-2" style={{ width: "4.5rem" }}>
      {servers.map((srv) => (
        <div key={srv.id} className="relative mb-2">
          <button
            onClick={() => onSelectServer?.(srv.id)}
            onContextMenu={(e) => {
              // Right-click to open the dropdown, for example
              e.preventDefault();
              toggleServerDropdown(srv.id.toString());
            }}
          >
            <ServerButton name={srv.name} />
          </button>

          {/** Dropdown for Edit/Delete */}
          {openServerDropdown === srv.id.toString() && (
            <div className="absolute left-full top-0 ml-2 bg-gray-700 p-2 rounded shadow z-10">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                onClick={() => handleOpenEdit(srv)}
              >
                Edit
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                onClick={() => handleOpenDelete(srv)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {/** “Create Server” button */}
      <div onClick={() => setShowCreateServer(true)}>
        <IconButton icon="+" name="Create Server" />
      </div>

      {/** “Join Server” button */}
      <div onClick={() => setShowJoinServer(true)}>
        <IconButton icon="🔗" name="Join Server" />
      </div>

      {/** CREATE SERVER MODAL */}
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
          <button
            className="bg-blue-500 p-1 mt-2"
            onClick={handleCreateServer}
          >
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

      {/** JOIN SERVER MODAL */}
      {showJoinServer && (
        <div className="absolute right-20 top-20 bg-gray-700 p-4 rounded shadow">
          <h3 className="text-lg font-bold">Join Server</h3>
          <input
            className="mt-2 p-1 text-black block"
            placeholder="Server Name"
            value={joinServerName}
            onChange={(e) => setJoinServerName(e.target.value)}
          />
          <button
            className="bg-green-500 p-1 mt-2"
            onClick={handleJoinServer}
          >
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

      {/** EDIT SERVER MODAL */}
      {showEditModal && selectedServer && (
        <EditServerModal
          serverId={selectedServer.id}
          currentName={selectedServer.name}
          currentDesc={selectedServer.description}
          onClose={() => setShowEditModal(false)}
          onSuccess={refetchServers}
        />
      )}

      {/** DELETE SERVER CONFIRMATION */}
      {showDeleteModal && selectedServer && (
        <DeleteServerConfirmation
          serverId={selectedServer.id}
          serverName={selectedServer.name}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={refetchServers}
        />
      )}
    </div>
  );
};

export default ServerBar;
