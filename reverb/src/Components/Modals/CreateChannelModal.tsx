// src/Components/Modals/CreateChannelModal.tsx

import React, { useState } from "react";
import useAuth from "../../Hooks/useAuth";
import { useStompContext } from "../../Hooks/useStompContext";

interface CreateChannelModalProps {
  serverId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ serverId, onClose, onSuccess }) => {
  const { auth } = useAuth();
  const stomp = useStompContext();

  const [channelName, setChannelName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!channelName.trim()) {
      setError("Channel name cannot be empty.");
      return;
    }

    try {
      alert("Channel created successfully!");
      onClose();
      stomp.createChannel(serverId.toString(), channelName.trim(), description.trim());
      onSuccess && onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create channel.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">Create Channel</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Channel Name</label>
            <input
              type="text"
              className="w-full p-2 text-black rounded"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
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

export default CreateChannelModal;
