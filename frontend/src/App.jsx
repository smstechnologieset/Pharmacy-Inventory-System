import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Medicine from "./pages/Medicine";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Expiration from "./pages/Expiration";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import Suppliers from "./pages/Suppliers";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SuperAdmin from "./pages/SuperAdmin";
import Signup from "./pages/Signup.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import PaymentVerify from "./pages/PaymentVerify.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PharmacySuspendedMessage from "./components/PharmacySuspendedMessage.jsx";
import PharmacyPendingMessage from "./components/PharmacyPendingMessage.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import LandingPage from "./pages/LandingPage"; // 🆕 LANDING PAGE IMPORT

import { useAuth } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000
        }
    }
});

// 🆕 PUBLIC ROUTE GUARD: Redirects logged-in users away from public pages
const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? <Navigate to="/dashboard" replace /> : children;
};

// 🚨 THE MASTER GATEKEEPER: Handles all status blocking cleanly
const ProtectedRoute = ({ children }) => {
    const { user, loading, pharmacyStatus, subscriptionStatus } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" />;

    // Super admin bypasses tenant checks
    if (user.role === "superadmin") return <Navigate to="/super-admin" />;

    // 1. Check Subscription Status (Payment)
    if (subscriptionStatus === "pending_payment") {
        return <PaymentVerify />;
    }

    // 2. Check Pharmacy Status (Admin Approval)
    if (pharmacyStatus === "pending") {
        return <PharmacyPendingMessage />;
    }

    // 3. Check Suspended Status
    if (pharmacyStatus === "suspended") {
        return <PharmacySuspendedMessage />;
    }

    // If all clear, render the children (Layout)
    return children;
};

// Super Admin Route Guard
const SuperAdminRoute = ({ children }) => {
    const { user, loading, authUser } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" />;
    if (user.role !== "superadmin") return <Navigate to="/" />;
    if (!authUser?.emailVerified) return <Navigate to="/verify-email" />;
    return children;
};

// Role Guard Component (Restricts access based on specific user roles)
const RoleGuard = ({ allowedRoles, children }) => {
    const { user } = useAuth();
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

const VerifyEmailRoute = ({ children }) => {
    const { authUser, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!authUser) return <Navigate to="/login" />;
    // If verified, send them to the main app (ProtectedRoute will handle the rest)    if (authUser.emailVerified) return <Navigate to="/dashboard" />;
    return children;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            {import.meta.env.VITE_ENV == "development" && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
            <Router>
                <Routes>
                    {/* 🌍 PUBLIC ROUTES */}
                    <Route
                        path="/"
                        element={
                            <PublicRoute>
                                <LandingPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/signup"
                        element={
                            <PublicRoute>
                                <Signup />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/verify-email"
                        element={
                            <PublicRoute>
                                <VerifyEmailRoute>
                                    <VerifyEmailPage />
                                </VerifyEmailRoute>
                            </PublicRoute>
                        }
                    />
                    <Route path="/payment/verify" element={<PaymentVerify />} />
                    <Route
                        path="/payment/success"
                        element={<PaymentSuccess />}
                    />

                    {/* 🔒 PROTECTED APP LAYOUT (Pathless to preserve exact URLs like /medicine, /inventory, etc.) */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* Core Operations */}
                        <Route
                            path="/medicine"
                            element={
                                <RoleGuard
                                    allowedRoles={[
                                        "admin",
                                        "manager",
                                        "pharmacist"
                                    ]}
                                >
                                    <Medicine />
                                </RoleGuard>
                            }
                        />
                        <Route
                            path="/inventory"
                            element={
                                <RoleGuard
                                    allowedRoles={[
                                        "admin",
                                        "manager",
                                        "pharmacist"
                                    ]}
                                >
                                    <Inventory />
                                </RoleGuard>
                            }
                        />
                        <Route
                            path="/sales"
                            element={
                                <RoleGuard
                                    allowedRoles={[
                                        "admin",
                                        "manager",
                                        "pharmacist"
                                    ]}
                                >
                                    <Sales />
                                </RoleGuard>
                            }
                        />
                        <Route
                            path="/expiration"
                            element={
                                <RoleGuard
                                    allowedRoles={[
                                        "admin",
                                        "manager",
                                        "pharmacist"
                                    ]}
                                >
                                    <Expiration />
                                </RoleGuard>
                            }
                        />

                        {/* Management & Reports */}
                        <Route
                            path="/suppliers"
                            element={
                                <RoleGuard allowedRoles={["admin", "manager"]}>
                                    <Suppliers />
                                </RoleGuard>
                            }
                        />
                        <Route
                            path="/reports"
                            element={
                                <RoleGuard allowedRoles={["admin", "manager"]}>
                                    <Reports />
                                </RoleGuard>
                            }
                        />
                        <Route
                            path="/staff"
                            element={
                                <RoleGuard allowedRoles={["admin", "manager"]}>
                                    <Staff />
                                </RoleGuard>
                            }
                        />

                        {/* System Settings */}
                        <Route
                            path="/settings"
                            element={
                                <RoleGuard allowedRoles={["admin"]}>
                                    <Settings />
                                </RoleGuard>
                            }
                        />

                        <Route
                            path="/invoices"
                            element={<Navigate to="/sales" replace />}
                        />
                    </Route>

                    {/* 🦸 SUPER ADMIN */}
                    <Route
                        path="/super-admin"
                        element={
                            <SuperAdminRoute>
                                <SuperAdmin />
                            </SuperAdminRoute>
                        }
                    />

                    {/* 🔁 FALLBACK */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
