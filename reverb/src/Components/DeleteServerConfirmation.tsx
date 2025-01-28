// src/Components/Modals/DeleteServerConfirmation.tsx

import React, { useState } from "react";
import { deleteServer } from "../Api/axios";
import useAuth from "../Hooks/useAuth";
import { useStompContext } from "../Hooks/useStompContext";

interface DeleteServerConfirmationProps {
  serverId: number;
  serverName: string;
  onClose: () => void;
  onDeleted?: () => void; // optional callback to remove from state
}

const DeleteServerConfirmation: React.FC<DeleteServerConfirmationProps> = ({
  serverId,
  serverName,
  onClose,
  onDeleted
}) => {
  const { auth } = useAuth();
  const [error, setError] = useState<string>("");
  const stomp = useStompContext();
  const handleDelete = async () => {
    setError("");
    try {
      await deleteServer(auth.accessToken, serverId);
      alert(`Server "${serverName}" deleted successfully!`);
      onClose();
      onDeleted && onDeleted();
      stomp.deleteServerSignal(serverId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete server.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Delete Server</h2>
        <p>Are you sure you want to delete the server "{serverName}"?</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="flex justify-end mt-4">
          <button
            className="bg-red-600 text-white px-4 py-2 rounded mr-2"
            onClick={handleDelete}
          >
            Delete
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteServerConfirmation;
