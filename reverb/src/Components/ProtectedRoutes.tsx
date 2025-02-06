import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../Hooks/useAuth";

const ProtectedRoute: React.FC = () => {
  const { auth } = useAuth();

  if (!auth.accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;