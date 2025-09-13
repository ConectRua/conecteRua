import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import MapaInterativo from "./pages/MapaInterativo";
import GestaoONGs from "./pages/GestaoONGs";
import CadastroManual from "./pages/CadastroManual";
import ImportacaoPlanilhas from "./pages/ImportacaoPlanilhas";
import BuscaCEP from "./pages/BuscaCEP";
import GestaoUBS from "./pages/GestaoUBS";
import Pacientes from "./pages/Pacientes";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="mapa" element={<MapaInterativo />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="cadastro" element={<CadastroManual />} />
            <Route path="importacao" element={<ImportacaoPlanilhas />} />
            <Route path="busca" element={<BuscaCEP />} />
            <Route path="ubs" element={<GestaoUBS />} />
            <Route path="ongs" element={<GestaoONGs />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
