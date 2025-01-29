// src/Components/Modals/CreateServerModal.tsx

import React, { useState } from "react";
import { createServer} from "../../Api/axios"; // Ensure you have a createServer API method
import useAuth from "../../Hooks/useAuth";
import { useStompContext } from "../../Hooks/useStompContext";

interface CreateServerModalProps {
  onClose: () => void;
  onSuccess?: () => void; // Optional callback to refresh server list
}

const CreateServerModal: React.FC<CreateServerModalProps> = ({ onClose, onSuccess }) => {
  const { auth } = useAuth();
  const stomp = useStompContext();

  const [serverName, setServerName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!serverName.trim()) {
      setError("Server name cannot be empty.");
      return;
    }

    try {
        // Create server via REST API
        await createServer(auth.accessToken, serverName.trim(), description.trim(),auth.userId,);
        alert("Server created successfully!");
        onClose();
        onSuccess && onSuccess();
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to create server.");
      }
    };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">Create Server</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Server Name</label>
            <input
              type="text"
              className="w-full p-2 text-black rounded"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Description (optional)</label>
            <textarea
              className="w-full p-2 text-black rounded"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Create
            </button>
            <button
              type="button"
              className="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServerModal;
