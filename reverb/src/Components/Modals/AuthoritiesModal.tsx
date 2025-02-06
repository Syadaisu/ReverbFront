// src/Components/GrantAuthoritiesModal.tsx

import React, { useState } from "react";
import { grantAdminByEmail, revokeAdmin } from "../../Api/axios";
import useAuth from "../../Hooks/useAuth";

interface AuthoritiesModalProps {
  serverId: number;
  serverName: string;
  onClose: () => void;
  onAuthorities: () => void;
}

const AuthoritiesModal: React.FC<AuthoritiesModalProps> = ({
  serverId,
  serverName,
  onClose,
  onAuthorities,
}) => {
  const { auth } = useAuth();

  const [email, setEmail] = useState("");

  const [action, setAction] = useState<"grant" | "revoke">("grant");

  const handleAction = async () => {
    if (!email.trim()) return;

    try {
      if (action === "grant") {
        //console.log("Granting authority on server", serverId, "to", email);
        await grantAdminByEmail(auth.accessToken, serverId, email);
        alert("Authorities granted to user "+email +"!");
      } else {
        //console.log("Revoking authority on server", serverName, "from", email);
        await revokeAdmin(auth.accessToken, serverName, email);
        alert("Authorities revoked for user "+email +"!");
      }

      onAuthorities();
      onClose();
    } catch (error) {
      //console.error(`Failed to ${action} authority:`, error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-700 p-4 rounded shadow w-80">
        <h3 className="text-lg font-bold mb-2">
          {action === "grant" ? "Grant Authorities" : "Revoke Authorities"}
        </h3>

        <div className="mb-4">
          <label className="block text-sm text-gray-300">
            Select Action:
            <select
              className="w-full mt-1 p-2 text-black rounded"
              value={action}
              onChange={(e) =>
                setAction(e.target.value as "grant" | "revoke")
              }
            >
              <option value="grant">Grant</option>
              <option value="revoke">Revoke</option>
            </select>
          </label>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-300">User’s Email:</p>
          <input
            type="email"
            className="w-full p-2 text-black rounded mt-1"
            placeholder="Enter user’s email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded mr-2"
            onClick={handleAction}
          >
            {action === "grant" ? "Grant" : "Revoke"}
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

export default AuthoritiesModal;
