import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../Hooks/useAuth";

const ProtectedRoute: React.FC = () => {
  const { auth } = useAuth();

  if (!auth.accessToken) {
    // User is not authenticated
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, allow access
  return <Outlet />;
};

export default ProtectedRoute;