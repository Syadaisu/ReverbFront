// src/Components/EditUserModal.tsx

import React, { useState } from "react";
import { editUser } from "../Api/axios";
import useAuth from "../Hooks/useAuth";

interface EditUserModalProps {
  onClose: () => void; // Parent will control whether to show
}

const EditUserModal: React.FC<EditUserModalProps> = ({ onClose }) => {
  const { auth, setAuth } = useAuth();

  // Pre-fill username with the current username from `auth`
  const [userName, setUserName] = useState<string>(auth?.username || "");
  const [oldPassword, setOldPassword] = useState<string>("");   // current password
  const [newPassword, setNewPassword] = useState<string>("");   // new password
  const [confirmPassword, setConfirmPassword] = useState<string>(""); // confirm (front-end only)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // If user typed a new password, confirm must match
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    // If user typed a new password, old password is required
    if (newPassword && !oldPassword) {
      setError("Old password is required to change your password.");
      return;
    }

    setLoading(true);
    try {
      // call the axios function
      await editUser(
        auth?.accessToken || "",
        userName.trim(),
        oldPassword.trim() || undefined,
        newPassword.trim() || undefined,
        avatarFile || undefined
      );

      alert("Profile updated successfully.");

      // Optionally update the auth context with the new username or avatar
      // If your backend returns the updated data, you can do something like:
      // const updatedUser = response.data.updatedUser; // depends on your backend
      // setAuth({ ...auth, username: updatedUser.userName, avatar: updatedUser.avatar });

      onClose();
    } catch (err: any) {
      console.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-6 rounded shadow-lg w-96">
        <h3 className="text-lg font-bold">Edit Profile</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          {/* Username */}
          <label className="block mb-2">
            Username:
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 p-2 w-full text-black"
              required
            />
          </label>

          {/* Old Password (only needed if user wants to change password) */}
          <label className="block mb-2">
            Current Password (only if changing password):
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-1 p-2 w-full text-black"
            />
          </label>

          {/* New Password */}
          <label className="block mb-2">
            New Password:
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 p-2 w-full text-black"
            />
          </label>

          {/* Confirm password (front-end only) */}
          <label className="block mb-2">
            Confirm New Password:
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 p-2 w-full text-black"
            />
          </label>

          {/* Avatar */}
          <label className="block mb-4">
            Avatar (optional):
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setAvatarFile(e.target.files[0]);
                }
              }}
              className="mt-1 p-2 w-full text-black"
            />
          </label>

          {error && <p className="text-red-500 mb-2">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              disabled={loading}
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
