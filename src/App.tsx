import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import { queryClient } from "./lib/queryClient";
import Dashboard from "./pages/Dashboard";
import MapaInterativo from "./pages/MapaInterativo";
import GestaoONGs from "./pages/GestaoONGs";
import CadastroManual from "./pages/CadastroManual";
import ImportacaoPlanilhas from "./pages/ImportacaoPlanilhas";
import BuscaCEP from "./pages/BuscaCEP";
import GestaoUBS from "./pages/GestaoUBS";
import GestaoEquipamentos from "./pages/GestaoEquipamentos";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import AtividadesTerritoriais from "./pages/AtividadesTerritoriais";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import AdminUsuarios from "./pages/AdminUsuarios";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route for authentication */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="mapa" element={<MapaInterativo />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="atividades-territoriais" element={<AtividadesTerritoriais />} />
              <Route path="cadastro" element={<CadastroManual />} />
              <Route path="importacao" element={<ImportacaoPlanilhas />} />
              <Route path="busca" element={<BuscaCEP />} />
              <Route path="ubs" element={<GestaoUBS />} />
              <Route path="ongs" element={<GestaoONGs />} />
              <Route path="equipamentos" element={<GestaoEquipamentos />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route
                path="admin/usuarios"
                element={
                  <AdminRoute>
                    <AdminUsuarios />
                  </AdminRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
