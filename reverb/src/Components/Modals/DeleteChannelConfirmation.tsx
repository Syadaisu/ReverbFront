// src/Components/Modals/DeleteChannelConfirmation.tsx
import React, { useState } from "react";
import { deleteChannel } from "../../Api/axios";
import useAuth from "../../Hooks/useAuth";
import { useStompContext } from "../../Hooks/useStompContext";

interface DeleteChannelConfirmationProps {
  channelId: number;
  channelName: string;
  onClose: () => void;
  onDeleted?: () => void;
}

const DeleteChannelConfirmation: React.FC<DeleteChannelConfirmationProps> = ({
  channelId,
  channelName,
  onClose,
  onDeleted
}) => {
  const { auth } = useAuth();
  const [error, setError] = useState<string>("");
  const stomp = useStompContext();

  const handleDelete = async () => {
    setError("");
    try {
      await deleteChannel(auth.accessToken, channelId);
      alert(`Channel "${channelName}" deleted successfully!`);
      stomp.deleteChannelSignal(channelId);
      onClose();
      onDeleted && onDeleted();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete channel.");

    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Delete Channel</h2>
        <p>Are you sure you want to delete the channel "{channelName}"?</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="flex justify-end mt-4">
          <button
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded mr-2"
            onClick={handleDelete}
          >
            Delete
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteChannelConfirmation;
