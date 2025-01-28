// src/Components/DeleteMessageConfirmation.tsx
import React, { useState } from "react";
import { deleteMessage } from "../Api/axios";  // Adjust path as needed
import useAuth from "../Hooks/useAuth";
import { useStompContext } from "../Hooks/useStompContext"; // Adjust path as needed

interface DeleteMessageConfirmationProps {
  messageId: string;
  onClose: () => void;
  onDeleted?: () => void;
}

const DeleteMessageConfirmation: React.FC<DeleteMessageConfirmationProps> = ({
  messageId,
  onClose,
  onDeleted
}) => {
  const { auth } = useAuth();
  const [error, setError] = useState<string>("");
  const stomp = useStompContext();

  async function handleDelete() {
    setError("");
    try {
        console.log("messageId: " + messageId);
      // Call your axios method
      await deleteMessage(auth.accessToken, messageId);
      // Optionally alert or toast
      onDeleted?.();
      stomp.deleteMessageSignal(messageId);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete message.");
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Delete Message</h2>
        <p>Are you sure you want to delete this message?</p>
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

export default DeleteMessageConfirmation;
