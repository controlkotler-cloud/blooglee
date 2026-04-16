import { Suspense, lazy } from "react";
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

// Public pages - loaded eagerly (landing, pricing are critical for first visit)
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";

// All other pages - lazy loaded
const SaasDashboard = lazy(() => import("./pages/SaasDashboard"));
const SiteDetail = lazy(() => import("./pages/SiteDetail"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const KnowledgeArticle = lazy(() => import("./pages/KnowledgeArticle"));
const OnboardingWizard = lazy(() =>
  import("./components/onboarding/OnboardingWizard").then((m) => ({ default: m.OnboardingWizard })),
);
const Auth = lazy(() => import("./pages/Auth"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));

// Casos de uso
const UseCaseClinicas = lazy(() => import("./pages/usecases/Clinicas"));
const UseCaseAgencias = lazy(() => import("./pages/usecases/Agencias"));
const UseCaseEcommerce = lazy(() => import("./pages/usecases/Ecommerce"));
const UseCaseAutonomos = lazy(() => import("./pages/usecases/Autonomos"));

// Alternativas
const AlternativesIndex = lazy(() => import("./pages/alternatives/Index"));
const AlternativeNextBlog = lazy(() => import("./pages/alternatives/NextBlog"));
const AlternativeJasper = lazy(() => import("./pages/alternatives/Jasper"));
const AlternativeCopyAi = lazy(() => import("./pages/alternatives/CopyAi"));

// Educativas
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Resources = lazy(() => import("./pages/Resources"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBetaUsers = lazy(() => import("./pages/admin/AdminBetaUsers"));
const AdminBetaInvitations = lazy(() => import("./pages/admin/AdminBetaInvitations"));
const AdminPrompts = lazy(() => import("./pages/admin/AdminPrompts"));
const AdminSurveys = lazy(() => import("./pages/admin/AdminSurveys"));
const AdminSocialContent = lazy(() => import("./pages/admin/AdminSocialContent"));
const AdminPermissions = lazy(() => import("./pages/admin/AdminPermissions"));

// Beta
const BetaSignup = lazy(() => import("./pages/BetaSignup"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
  </div>
);

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
              <Suspense fallback={<PageLoader />}>
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
                  <Route
                    path="/admin/permissions"
                    element={
                      <ProtectedRoute requireSuperAdmin>
                        <AdminPermissions />
                      </ProtectedRoute>
                    }
                  />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </SupportChatProvider>
          </BrowserRouter>
        </TooltipProvider>
      </GenerationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
