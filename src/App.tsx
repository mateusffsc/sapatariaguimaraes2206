
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ClientesPage } from "./pages/ClientesPage";
import { OrdensServicoPage } from "./pages/OrdensServicoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/ordens-servico" element={<OrdensServicoPage />} />
            <Route path="/vendas" element={<div className="p-8 text-center text-gray-500">Página de Vendas - Em desenvolvimento</div>} />
            <Route path="/crediario" element={<div className="p-8 text-center text-gray-500">Página de Crediário - Em desenvolvimento</div>} />
            <Route path="/financeiro" element={<div className="p-8 text-center text-gray-500">Página Financeiro - Em desenvolvimento</div>} />
            <Route path="/estoque" element={<div className="p-8 text-center text-gray-500">Página de Estoque - Em desenvolvimento</div>} />
            <Route path="/cadastros" element={<div className="p-8 text-center text-gray-500">Página de Cadastros - Em desenvolvimento</div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
