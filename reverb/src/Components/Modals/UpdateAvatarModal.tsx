// src/Components/UpdateAvatarModal.tsx

import React, { useState } from "react";
import { uploadAvatar, getUser } from "../../Api/axios";
import useAuth from "../../Hooks/useAuth";
import { useStompContext } from "../../Hooks/useStompContext";

interface UpdateAvatarModalProps {
  onClose: () => void;
  onUploadSuccess: () => void;
}

const UpdateAvatarModal: React.FC<UpdateAvatarModalProps> = ({ onClose, onUploadSuccess }) => {
  const { auth,setAuth } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const stomp = useStompContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!avatarFile) {
      setError("Please select an avatar file first.");
      return;
    }

    setLoading(true);
    try {
      await uploadAvatar(auth?.accessToken || "", auth.userId, avatarFile);
      alert("Avatar updated successfully.");
      getUser(auth.accessToken, auth.userId)
                .then((resp) => {
                    if (resp.data) {
                      console.log("resp.data.avatarUuid: " + resp.data.avatarUuid);
                        setAuth((prev) => ({
                            ...prev,
                            avatar: resp.data.avatarUuid
                        }));
                    }
                })
                .catch(console.error);
      onUploadSuccess();
      stomp.editUserSignal(auth.userId);
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
                  setAvatarFile(e.target.files[0]);
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

export default UpdateAvatarModal;
