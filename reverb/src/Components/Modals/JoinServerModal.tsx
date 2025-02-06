// src/Components/Modals/JoinServerModal.tsx

import React, { useState } from "react";
import { joinServer } from "../../Api/axios";
import useAuth from "../../Hooks/useAuth";

interface JoinServerModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const JoinServerModal: React.FC<JoinServerModalProps> = ({ onClose, onSuccess }) => {
  const { auth } = useAuth();

  const [serverName, setServerName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!serverName.trim()) {
      setError("Server name cannot be empty.");
      return;
    }

    try {
      await joinServer(auth.accessToken, serverName.trim(), auth.userId);
      alert("Joined server successfully!");
      onClose();
      onSuccess && onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join server.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">Join Server</h2>
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
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded mr-2"
            >
              Join
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

export default JoinServerModal;
