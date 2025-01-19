// src/Components/Modals/EditChannelModal.tsx

import React, { useState } from "react";
import { editChannel } from "../Api/axios";
import useAuth from "../Hooks/useAuth";

interface EditChannelModalProps {
  channelId: number;
  currentName: string;
  currentDesc?: string;
  onClose: () => void;
  onSuccess?: () => void; // callback to refresh channel list
}

const EditChannelModal: React.FC<EditChannelModalProps> = ({
  channelId,
  currentName,
  currentDesc,
  onClose,
  onSuccess
}) => {
  const { auth } = useAuth();
  const [channelName, setChannelName] = useState<string>(currentName);
  const [description, setDescription] = useState<string>(currentDesc || "");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!channelName.trim()) {
      setError("Channel name cannot be empty.");
      return;
    }

    try {
      await editChannel(auth.accessToken, channelId, channelName.trim(), description.trim());
      alert("Channel updated successfully!");
      onClose();
      onSuccess && onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to edit channel.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Edit Channel</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block font-semibold mb-1">Channel Name</label>
            <input
              type="text"
              className="w-full p-2 text-black rounded"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
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
              className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              Save
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded"
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

export default EditChannelModal;
