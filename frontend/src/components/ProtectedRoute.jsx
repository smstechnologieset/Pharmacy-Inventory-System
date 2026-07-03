
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen"; // Assuming you have a loading component

const ProtectedRoute = ({ children, requireVerification = true }) => {
  const { user, authUser, loading, needsVerification } = useAuth();
  const location = useLocation();

  // 1. Show loading while Firebase initializes
  if (loading) {
    return <LoadingScreen />; 
  }

  // 2. If not logged in at all, redirect to login
  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check Email Verification (If required for this specific route)
  if (requireVerification && needsVerification) {
    return <Navigate to="/verify-email" replace />;
  }

  // 4. Check if they have completed onboarding (Have a pharmacyId)
  // We only enforce this if they aren't currently in the signup/payment flow
  if (user && !user.pharmacyId && !location.pathname.startsWith('/payment')) {
     // If they are logged in, verified, but have no pharmacy, they are in limbo.
     // Send them back to signup.
     return <Navigate to="/signup" replace />;
  }

  // 5. All checks passed, render the page
  return children;
};

export default ProtectedRoute;
