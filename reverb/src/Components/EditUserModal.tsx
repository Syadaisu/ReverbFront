// src/Components/EditUserModal.tsx

import React, { useState } from "react";
import { editUserData } from "../Api/axios";
import useAuth from "../Hooks/useAuth";
import { useStompContext } from "../Hooks/useStompContext";

interface EditUserModalProps {
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ onClose }) => {
  const { auth,setAuth } = useAuth();
  // The user can choose a new username, or keep existing
  const [userName, setUserName] = useState<string>(auth?.username || "");
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const stomp = useStompContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // If user typed a new password, confirm must match
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Call editUserData
      await editUserData(
        auth?.accessToken || "",
        auth.userId,
        userName.trim() || undefined,
        oldPassword.trim() || undefined,
        newPassword.trim() || undefined
      );
      alert("User data updated successfully.");
      console.log ("auth.username: " + auth.username + " userName: " + userName);
      setAuth((prev) => ({
        ...prev,
        username: userName.trim()
      }));
      // Optionally update local state or context if needed
      // e.g. setAuth({ ...auth, username: userName });
      stomp.editUserSignal(auth.userId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error updating user data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-700 p-4 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            Username:
            <input
              type="text"
              className="w-full p-2 text-black"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </label>
          <label className="block mb-2">
            Current Password (if changing password):
            <input
              type="password"
              className="w-full p-2 text-black"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </label>
          <label className="block mb-2">
            New Password:
            <input
              type="password"
              className="w-full p-2 text-black"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label className="block mb-2">
            Confirm New Password:
            <input
              type="password"
              className="w-full p-2 text-black"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              {loading ? "Updating..." : "Update"}
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded"
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

export default EditUserModal;
