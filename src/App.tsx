import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ChamadosList from "./pages/ChamadosList";
import ChamadoDetail from "./pages/ChamadoDetail";
import NovoChamado from "./pages/NovoChamado";
import KanbanBoard from "./pages/KanbanBoard";
import AdminSetores from "./pages/admin/AdminSetores";
import AdminPrioridades from "./pages/admin/AdminPrioridades";
import AdminStatus from "./pages/admin/AdminStatus";
import AdminTiposSuporte from "./pages/admin/AdminTiposSuporte";
import AdminClassesSuporte from "./pages/admin/AdminClassesSuporte";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile && profile.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/chamados" element={<ChamadosList />} />
                <Route path="/chamados/novo" element={<NovoChamado />} />
                <Route path="/chamados/:id" element={<ChamadoDetail />} />
                <Route path="/kanban" element={<KanbanBoard />} />
                <Route path="/admin/setores" element={<AdminRoute><AdminSetores /></AdminRoute>} />
                <Route path="/admin/prioridades" element={<AdminRoute><AdminPrioridades /></AdminRoute>} />
                <Route path="/admin/status" element={<AdminRoute><AdminStatus /></AdminRoute>} />
                <Route path="/admin/tipos-suporte" element={<AdminRoute><AdminTiposSuporte /></AdminRoute>} />
                <Route path="/admin/classes-suporte" element={<AdminRoute><AdminClassesSuporte /></AdminRoute>} />
                <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
