import React, { useEffect } from "react";
import ReactDOM from "react-dom";

interface ServerData {
  id: number;
  name: string;
  description?: string;
  serverIconUuid?: string;
  ownerId?: number;
}

interface ServerDropdownProps {
  server: ServerData;
  position: { top: number; left: number };
  onClose: () => void;
  onEdit: (server: ServerData) => void;
  onDelete: (server: ServerData) => void;
  onChangeIcon: (server: ServerData) => void;
  onGrantAuthorities: (server: ServerData) => void;
  canEdit: boolean;
  isOwner: boolean;
}

const ServerDropdown: React.FC<ServerDropdownProps> = ({
  server,
  position,
  onClose,
  onEdit,
  onDelete,
  onChangeIcon,
  onGrantAuthorities,
  canEdit,
  isOwner,
}) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      onClose();
    };
    // Add event listener to detect clicks outside the dropdown
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Prevent the dropdown itself from triggering the close
  const handleDropdownMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // Fetch the portal container
  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null; // Safety check

  return ReactDOM.createPortal(
    <div
      className="absolute bg-gray-700 rounded shadow z-50 w-48 text-white"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()} // Prevent click events from bubbling
      onMouseDown={handleDropdownMouseDown} // Prevent mousedown events from bubbling
    >
      {/* If Owner => can do Grant & Delete */}
      {isOwner && (
        <>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-600"
            onClick={() => {
              console.log("Grant Authorities clicked");
              onGrantAuthorities(server);
              onClose();
            }}
          >
            Grant Authorities
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-red-500"
            onClick={() => {
              console.log("Delete clicked");
              onDelete(server);
              onClose();
            }}
          >
            Delete
          </button>
        </>
      )}

      {/* If Owner or Authorized => can do Edit & Icon */}
      {canEdit && (
        <>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-600"
            onClick={() => {
              console.log("Edit clicked");
              onEdit(server);
              onClose();
            }}
          >
            Edit
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-600"
            onClick={() => {
              console.log("Change Icon clicked");
              onChangeIcon(server);
              onClose();
            }}
          >
            Change Icon
          </button>
        </>
      )}
    </div>,
    portalRoot
  );
};

export default ServerDropdown;
