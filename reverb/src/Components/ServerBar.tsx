// ServerBar.tsx (simplified example)
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ServerButton, IconButton } from "./IconLib";
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
  const { auth } = useAuth();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    console.log("useEffect for fetching servers triggered");
    console.log("Auth object:", auth);
    if (!auth?.accessToken) {
      console.log("No auth.token, skipping fetch");
      return;
    }
    
    getUserServers(auth.accessToken, auth.userId)
      .then((resp) => {
        console.log("Servers loaded:", resp.data);

        if (!Array.isArray(resp.data)) {
          console.error("Expected resp.data to be an array, but it's not:", resp.data);
          return;
        }
        const transformedServers: ServerData[] = resp.data.map((srv: any) => {
          if (!srv.serverId || !srv.serverName) {
            console.warn("Incomplete server data:", srv);
            return null; 
          }

          return {
            id: srv.serverId.toString(),          
            name: srv.serverName,           
            description: srv.description,   
          };
        }).filter((srv: ServerData | null) => srv !== null) as ServerData[]; 

        console.log("Transformed servers:", transformedServers);
        setServers(transformedServers);
      })
      .catch((error) => {
        console.error("Failed to load servers", error);
      });
  }, [auth]);

  useEffect(() => {
    if (!stomp || !stomp.connected) return;
    const sub = stomp.onServerCreated((event) => {
      console.log("Received server.created event:", event);

      // Transform the event data to match ServerData
      const newServer: ServerData = {
        id: event.id.toString(), // Ensure ID is a string
        name: event.name || "Unnamed Server", // Fallbacks
        description: event.description,
      };

      console.log("Adding new server to state:", newServer);
      setServers((prev) => [...prev, newServer]);
    });
    return () => sub?.unsubscribe();
  }, [stomp]);


  const refetchServers = () => {
    getUserServers(auth.accessToken, auth.userId)
    .then((resp) => {
      console.log("Servers loaded:", resp.data);

      if (!Array.isArray(resp.data)) {
        console.error("Expected resp.data to be an array, but it's not:", resp.data);
        return;
      }
      const transformedServers: ServerData[] = resp.data.map((srv: any) => {
        if (!srv.serverId || !srv.serverName) {
          console.warn("Incomplete server data:", srv);
          return null; 
        }

        return {
          id: srv.serverId.toString(),          
          name: srv.serverName,           
          description: srv.description,   
        };
      }).filter((srv: ServerData | null) => srv !== null) as ServerData[]; 

      console.log("Transformed servers:", transformedServers);
      setServers(transformedServers);
    })
    .catch((error) => {
      console.error("Failed to load servers", error);
    });
  }


  // 3) “Create Server” method
  const handleCreateServer = () => {
    if (!newName) {
      console.log("Server Name is empty. Aborting creation.");
      return;
    }
    console.log("Creating server with Name:", newName, "Description:", newDesc, "User ID:", auth.userId);
    stomp.createServer(newName, auth.userId, newDesc)
        console.log("Server creation request sent successfully.");
        setNewName("");
        setNewDesc("");
        setShowCreateServer(false);
        refetchServers();
  };


  return (
    <div>
        <div 
        className="flex flex-col items-center bg-gray-900 p-2"
        style={{ width: "4.5rem" }}
        >
        {/* Render existing servers */}
        {servers.map((srv) => (
            <Link key={srv.id} to={`/server/${srv.id}`}>
            <ServerButton name={srv.name} />
            </Link>
        ))}

        {/* “+” button to create a new server in real time */}
        <div onClick={() => setShowCreateServer(true)}>
            <IconButton icon="+" name="Create Server" />
        </div>

        {/* Modal for creating server */}
        {showCreateServer && (
            <div className="right-20 absolute top-20 bg-gray-700 p-4 rounded shadow">
            <h3 className="text-lg font-bold">Create Server</h3>
            <input
              className="mt-2 p-1 text-black"
              placeholder="Server Name"
              value={newName}
              onChange={(e) => {
                console.log("Server Name Input Changed:", e.target.value);
                setNewName(e.target.value);
              }}
            />
            <textarea
              className="mt-2 p-1 text-black"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => {
                console.log("Server Description Input Changed:", e.target.value);
                setNewDesc(e.target.value);
              }}
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
