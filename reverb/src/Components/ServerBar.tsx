// ServerBar.tsx (simplified example)
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ServerButton, IconButton } from "./IconLib";
import { useStompContext } from "../Hooks/useStompContext";
import { getUserServers } from "../Api/axios"; // your REST helper
import useAuth from "../Hooks/useAuth";
import { useStomp } from "../Hooks/useStomp";

interface ServerData {
  id: string;
  name: string;
  description?: string;
}

const ServerBar = () => {
  const stomp = useStomp();
  const { auth } = useAuth(); // { id, username, email, token, etc. }
  const [servers, setServers] = useState<ServerData[]>([]);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // 1) On mount, fetch the servers via REST
  useEffect(() => {
    // Suppose the `auth.id` is the user’s ID
    console.log("useEffect for fetching servers triggered");
    console.log("Auth object:", auth);
    if (!auth?.accessToken) {
      console.log("No auth.token, skipping fetch");
      return;
    }
    
    // The endpoint getServer() calls /server/getByUser/{serverId}
    // but in your snippet, it's a bit confusing naming.
    // Let's assume you want to pass the *userId* instead of "serverId" 
    // because /server/getByUser/ typically expects userId.
    getUserServers(auth.accessToken, auth.id)
      .then((resp) => {
        console.log("Servers loaded:", resp.data);

        if (!Array.isArray(resp.data)) {
          console.error("Expected resp.data to be an array, but it's not:", resp.data);
          return;
        }
        // Transform the response data to match ServerData interface
        const transformedServers: ServerData[] = resp.data.map((srv: any) => {
          if (!srv.serverId || !srv.serverName) {
            console.warn("Incomplete server data:", srv);
            return null; // or handle as per your requirement
          }

          return {
            id: srv.serverId.toString(),           // Convert number to string
            name: srv.serverName,           // Map serverName to name
            description: srv.description,    // Direct mapping
          };
        }).filter((srv: ServerData | null) => srv !== null) as ServerData[]; // Remove nulls

        console.log("Transformed servers:", transformedServers);
        setServers(transformedServers);
      })
      .catch((error) => {
        console.error("Failed to load servers", error);
      });
  }, [auth]);

  // 2) Subscribe to “server.created” in real time 
  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    const sub = stomp.onServerCreated((event) => {
      // event: { id, name, description }
      setServers((prev) => [...prev, event]);
    });
    return () => sub?.unsubscribe();
  }, [stomp]);

  // 3) “Create Server” method
  const handleCreateServer = () => {
    if (!newName) return;
    stomp.createServer(newName, auth.id, newDesc);
    setNewName("");
    setNewDesc("");
    setShowCreateServer(false);
  };

  return (
    <div>
        <div 
        className="flex flex-col items-center bg-gray-900 p-2"
        style={{ width: "4.5rem" }}
        >
        {/* Render existing servers */}
        {servers.map((srv) => (
            <Link key={srv.id} to={`/home/server/${srv.id}`}>
            <ServerButton name={srv.name} />
            </Link>
        ))}

        {/* “+” button to create a new server in real time */}
        <div onClick={() => setShowCreateServer(true)}>
            <IconButton icon="+" name="Create Server" />
        </div>

        {/* Modal for creating server */}
        {showCreateServer && (
            <div className="absolute top-20 bg-gray-700 p-4 rounded shadow">
            <h3 className="text-lg font-bold">Create Server</h3>
            <input
                className="mt-2 p-1 text-black"
                placeholder="Server Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
            />
            <textarea
                className="mt-2 p-1 text-black"
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
        </div>
    </div>
  );
};

export default ServerBar;
