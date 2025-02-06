// src/Components/Modals/DeleteServerConfirmation.tsx

import React, { useState } from "react";
import { deleteServer, leaveServer } from "../../Api/axios";
import useAuth from "../../Hooks/useAuth";

interface LeaveServerConfirmationProps {
  serverId: number;
  serverName: string;
  onClose: () => void;
  onLeft?: () => void;
}

const LeaveServerConfirmation: React.FC<LeaveServerConfirmationProps> = ({
  serverId,
  serverName,
  onClose,
  onLeft
}) => {
  const { auth } = useAuth();
  const [error, setError] = useState<string>("");
  const handleLeave = async () => {
    setError("");
    try {
      await leaveServer(auth.accessToken,serverName,auth.userId);
      alert(`Server "${serverName}" left successfully!`);
      onClose();
      onLeft && onLeft();
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete server.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Leave Server</h2>
        <p>Are you sure you want to leave the server "{serverName}"?</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="flex justify-end mt-4">
          <button
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded mr-2"
            onClick={handleLeave}
          >
            Leave
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

export default LeaveServerConfirmation;
