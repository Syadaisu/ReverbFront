// src/Components/UpdateAvatarModal.tsx

import React, { useState } from "react";
import { uploadServerIcon } from "../../Api/axios";
import useAuth from "../../Hooks/useAuth";
import { useStompContext } from "../../Hooks/useStompContext";

interface UpdateServerIconProps {
  serverId: number;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const UpdateServerIcon: React.FC<UpdateServerIconProps> = ({ onClose, onUploadSuccess, serverId }) => {
  const { auth } = useAuth();
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const stomp = useStompContext();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!iconFile) {
      setError("Please select an avatar file first.");
      return;
    }

    setLoading(true);
    try {
        //console.log("serverId: ", serverId);
      await uploadServerIcon(auth.accessToken, serverId, iconFile);

      alert("Avatar updated successfully.");
      onUploadSuccess();
      stomp.editServerSignal(serverId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error updating avatar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-700 p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Update Avatar</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            Select File:
            <input
              type="file"
              accept="image/*"
              className="w-full p-2 text-white"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setIconFile(e.target.files[0]);
                }
              }}
            />
          </label>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              className="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateServerIcon;
