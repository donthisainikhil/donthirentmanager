import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useStore } from "@/store/useStore";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import AccessManagement from "./pages/AccessManagement";
import AdminDataViewer from "./pages/AdminDataViewer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function FirebaseInitializer({ children }: { children: React.ReactNode }) {
  const { user, isApproved } = useAuth();
  const initializeData = useStore((state) => state.initializeData);
  const resetStore = useStore((state) => state.resetStore);
  
  // Initialize push notifications for native platforms
  usePushNotifications();
  
  useEffect(() => {
    if (user && isApproved) {
      initializeData(user.uid);
    } else {
      resetStore();
    }
  }, [user?.uid, isApproved, initializeData, resetStore]);
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FirebaseInitializer>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/pending" element={<PendingApproval />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties"
                element={
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenants"
                element={
                  <ProtectedRoute>
                    <Tenants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <Expenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/access"
                element={
                  <ProtectedRoute>
                    <AccessManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-data"
                element={
                  <ProtectedRoute>
                    <AdminDataViewer />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FirebaseInitializer>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
