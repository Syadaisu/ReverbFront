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
  onAuthorities: (server: ServerData) => void;
  onLeaveServer: (server: ServerData) => void;
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
  onAuthorities,
  onLeaveServer,
  canEdit,
  isOwner,
}) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleDropdownMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;
  return ReactDOM.createPortal(
    <div
      className="absolute bg-gray-700 rounded shadow z-50 w-48 text-white"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={handleDropdownMouseDown}
    >
      {isOwner && (
        <>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-600"
            onClick={() => {
              //console.log("Grant Authorities clicked");
              onAuthorities(server);
              onClose();
            }}
          >
            Authorities Management
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-red-500"
            onClick={() => {
              //console.log("Delete clicked");
              onDelete(server);
              onClose();
            }}
          >
            Delete
          </button>
        </>
      )}

      {canEdit && (
        <>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-600"
            onClick={() => {
              //console.log("Edit clicked");
              onEdit(server);
              onClose();
            }}
          >
            Edit
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-600"
            onClick={() => {
              //console.log("Change Icon clicked");
              onChangeIcon(server);
              onClose();
            }}
          >
            Change Icon
          </button>
        </>
      )}
      {!isOwner && (
        <button
          className="block w-full text-left px-4 py-2 hover:bg-red-500"
          onClick={() => {
            //console.log("Leave Server clicked");
            onLeaveServer(server);
            onClose();
          }}
        >
          Leave Server
        </button>
      )}
    </div>,
    portalRoot
  );
};

export default ServerDropdown;
