import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ClientesPage } from "./pages/ClientesPage";
import { OrdensServicoPage } from "./pages/OrdensServicoPage";
import { VendasPage } from "./pages/VendasPage";
import { CrediarioPage } from "./pages/CrediarioPage";
import { FinanceiroPage } from "./pages/FinanceiroPage";
import { EstoquePage } from "./pages/EstoquePage";
import { FornecedoresPage } from "./pages/FornecedoresPage";
import { ComprasPage } from "./pages/ComprasPage";
import { ServicosPage } from "./pages/ServicosPage";
import { TecnicosPage } from "./pages/TecnicosPage";
import { FormasPagamentoPage } from "./pages/FormasPagamentoPage";
import { BancosPage } from "./pages/BancosPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import UsuariosPage from "./pages/UsuariosPage";
import LoginPage from "./pages/LoginPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { WhatsAppPage } from "./pages/WhatsAppPage";
import { ConsultaPublicaPage } from "./pages/ConsultaPublicaPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/consulta/:tipo/:id" element={<ConsultaPublicaPage />} />
          
          {/* Rotas sem proteção - TEMPORÁRIO PARA TESTES */}
          <Route path="/" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          
          <Route path="/clientes" element={
            <AppLayout>
              <ClientesPage />
            </AppLayout>
          } />
          
          <Route path="/ordens-servico" element={
            <AppLayout>
              <OrdensServicoPage />
            </AppLayout>
          } />
          
          <Route path="/vendas" element={
            <AppLayout>
              <VendasPage />
            </AppLayout>
          } />
          
          <Route path="/crediario" element={
            <AppLayout>
              <CrediarioPage />
            </AppLayout>
          } />
          
          <Route path="/financeiro" element={
            <AppLayout>
              <FinanceiroPage />
            </AppLayout>
          } />
          
          <Route path="/estoque" element={
            <AppLayout>
              <EstoquePage />
            </AppLayout>
          } />
          
          <Route path="/fornecedores" element={
            <AppLayout>
              <FornecedoresPage />
            </AppLayout>
          } />
          
          <Route path="/compras" element={
            <AppLayout>
              <ComprasPage />
            </AppLayout>
          } />
          
          <Route path="/servicos" element={
            <AppLayout>
              <ServicosPage />
            </AppLayout>
          } />
          
          <Route path="/tecnicos" element={
            <AppLayout>
              <TecnicosPage />
            </AppLayout>
          } />
          
          <Route path="/formas-pagamento" element={
            <AppLayout>
              <FormasPagamentoPage />
            </AppLayout>
          } />
          
          <Route path="/bancos" element={
            <AppLayout>
              <BancosPage />
            </AppLayout>
          } />
          
          <Route path="/usuarios" element={
            <AppLayout>
              <UsuariosPage />
            </AppLayout>
          } />
          
          <Route path="/configuracoes" element={
            <AppLayout>
              <ConfiguracoesPage />
            </AppLayout>
          } />
          
          <Route path="/analytics" element={
            <AppLayout>
              <AnalyticsPage />
            </AppLayout>
          } />
          
          <Route path="/relatorios" element={
            <AppLayout>
              <RelatoriosPage />
            </AppLayout>
          } />
          
          <Route path="/whatsapp" element={
            <AppLayout>
              <WhatsAppPage />
            </AppLayout>
          } />
          
          <Route path="/cadastros" element={
            <ProtectedRoute>
              <AppLayout>
                <div className="p-8 text-center text-gray-500">Página de Cadastros - Em desenvolvimento</div>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
