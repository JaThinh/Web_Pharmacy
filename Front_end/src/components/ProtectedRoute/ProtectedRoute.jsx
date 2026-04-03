import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext.jsx";

// Enhanced ProtectedRoute: supports both user and admin routes
export default function ProtectedRoute({ children, adminOnly = false }) {
  const auth = useAuth();
  const user = auth?.user;
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If adminOnly route but user is not admin, redirect to shop
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/shop" replace />;
  }
  
  return children;
}
