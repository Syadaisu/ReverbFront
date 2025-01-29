// src/Components/Modals/EditServerModal.tsx

import React, { useState } from "react";
import { editServer } from "../../Api/axios";
import useAuth from "../../Hooks/useAuth";
import { useStompContext } from "../../Hooks/useStompContext";

interface EditServerModalProps {
  serverId: number;
  currentName: string;
  currentDesc?: string;
  onClose: () => void;
  onSuccess?: () => void; // optional callback to refresh server list
}

const EditServerModal: React.FC<EditServerModalProps> = ({
  serverId,
  currentName,
  currentDesc,
  onClose,
  onSuccess
}) => {
  const { auth } = useAuth();
  const [serverName, setServerName] = useState<string>(currentName);
  const [description, setDescription] = useState<string>(currentDesc || "");
  const [error, setError] = useState<string>("");
  const stomp = useStompContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!serverName.trim()) {
      setError("Server name cannot be empty.");
      return;
    }

    try {
      await editServer(auth.accessToken, serverId, serverName.trim(), description.trim());
      alert("Server updated successfully!");
      onClose();
      stomp.editServerSignal(serverId);
      onSuccess && onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to edit server.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Edit Server</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Server Name</label>
            <input
              type="text"
              className="w-full p-2 text-black rounded"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              className="w-full p-2 text-black rounded"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Save
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

export default EditServerModal;
