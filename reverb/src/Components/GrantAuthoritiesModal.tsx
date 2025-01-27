// src/Components/GrantAuthoritiesModal.tsx
import React, { useState } from "react";
import { grantAdminByEmail } from "../Api/axios";
import useAuth from "../Hooks/useAuth";

interface GrantAuthoritiesModalProps {
  serverId: number;
  onClose: () => void;
  onGranted: () => void; // callback to refetch servers or update state
}

const GrantAuthoritiesModal: React.FC<GrantAuthoritiesModalProps> = ({
  serverId,
  onClose,
  onGranted,
}) => {
  const [email, setEmail] = useState("");
  const { auth } = useAuth();

  const handleGrant = async () => {
    if (!email.trim()) return;
    try {
      console.log("Granting authority on server", serverId, "to", email);
      grantAdminByEmail(auth.accessToken, serverId, email);
      onGranted(); // e.g., refetch or update UI
      onClose();
    } catch (error) {
      console.error("Failed to grant authority:", error);
    }
  };

  return (
    <div className="absolute right-20 top-20 bg-gray-700 p-4 rounded shadow">
      <h3 className="text-lg font-bold">Grant Authorities</h3>
      <p className="text-sm text-gray-300 mb-2">Enter the user's email to grant permissions:</p>
      <input
        type="email"
        className="w-full p-1 text-black"
        placeholder="User Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <button
          className="bg-blue-500 p-1 mr-2"
          onClick={handleGrant}
        >
          Grant
        </button>
        <button
          className="bg-gray-500 p-1"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default GrantAuthoritiesModal;
