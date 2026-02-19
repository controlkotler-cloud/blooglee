import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { GenerationProvider } from "@/contexts/GenerationContext";
import { SupportChatProvider } from "@/components/saas/SupportChatWidget";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import SaasDashboard from "./pages/SaasDashboard";
import SiteDetail from "./pages/SiteDetail";
import AccountSettings from "./pages/AccountSettings";
import BillingPage from "./pages/BillingPage";
import HelpPage from "./pages/HelpPage";
import KnowledgeArticle from "./pages/KnowledgeArticle";
import MKPro from "./pages/MKPro";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import Auth from "./pages/Auth";
import Waitlist from "./pages/Waitlist";
import NotFound from "./pages/NotFound";
import ContactPage from "./pages/ContactPage";
import FeaturesPage from "./pages/FeaturesPage";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";

// Nuevas páginas SEO - Casos de uso
import UseCaseClinicas from "./pages/usecases/Clinicas";
import UseCaseAgencias from "./pages/usecases/Agencias";
import UseCaseEcommerce from "./pages/usecases/Ecommerce";
import UseCaseAutonomos from "./pages/usecases/Autonomos";

// Nuevas páginas SEO - Alternativas
import AlternativesIndex from "./pages/alternatives/Index";
import AlternativeNextBlog from "./pages/alternatives/NextBlog";
import AlternativeJasper from "./pages/alternatives/Jasper";
import AlternativeCopyAi from "./pages/alternatives/CopyAi";

// Nuevas páginas SEO - Educativas
import HowItWorks from "./pages/HowItWorks";
import Resources from "./pages/Resources";

// Páginas Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBetaUsers from "./pages/admin/AdminBetaUsers";
import AdminBetaInvitations from "./pages/admin/AdminBetaInvitations";
import AdminPrompts from "./pages/admin/AdminPrompts";
import AdminSurveys from "./pages/admin/AdminSurveys";
import AdminSocialContent from "./pages/admin/AdminSocialContent";

// Beta Signup
import BetaSignup from "./pages/BetaSignup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
       <GenerationProvider>
         <TooltipProvider>
           <Toaster />
           <Sonner />
      <BrowserRouter>
        <SupportChatProvider>
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          
          {/* Páginas de casos de uso */}
          <Route path="/para/clinicas" element={<UseCaseClinicas />} />
          <Route path="/para/agencias-marketing" element={<UseCaseAgencias />} />
          <Route path="/para/tiendas-online" element={<UseCaseEcommerce />} />
          <Route path="/para/autonomos" element={<UseCaseAutonomos />} />
          
          {/* Hub de alternativas */}
          <Route path="/alternativas" element={<AlternativesIndex />} />
          <Route path="/alternativas/nextblog" element={<AlternativeNextBlog />} />
          <Route path="/alternativas/jasper" element={<AlternativeJasper />} />
          <Route path="/alternativas/copy-ai" element={<AlternativeCopyAi />} />
          
          {/* Páginas educativas */}
          <Route path="/como-funciona" element={<HowItWorks />} />
          <Route path="/recursos" element={<Resources />} />
          
          {/* Beta Signup - Public route with token */}
          <Route path="/beta/:token" element={<BetaSignup />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <SaasDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/site/:id"
            element={
              <ProtectedRoute>
                <SiteDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help/article/:slug"
            element={
              <ProtectedRoute>
                <KnowledgeArticle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/wizard"
            element={
              <ProtectedRoute>
                <OnboardingWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mkpro"
            element={
              <ProtectedRoute>
                <MKPro />
              </ProtectedRoute>
            }
          />
          
          {/* Admin routes - SuperAdmin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/beta-users"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminBetaUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/invitations"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminBetaInvitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/surveys"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminSurveys />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/prompts"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminPrompts />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/social"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminSocialContent />
              </ProtectedRoute>
            }
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </SupportChatProvider>
      </BrowserRouter>
         </TooltipProvider>
       </GenerationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
