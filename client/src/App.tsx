import { Component, Suspense, lazy, useEffect, type ErrorInfo, type ReactNode } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { MenuTransitionProvider, useMenuTransition } from "@/contexts/MenuTransitionContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { NotificationTrigger } from "@/components/NotificationTrigger";
import { MenuTransitionOverlay } from "@/components/MenuTransitionOverlay";
import { WalkthroughModal } from "@/components/WalkthroughModal";
import { FloatingFeedbackButton } from "@/components/FloatingFeedbackButton";
import { AudioMiniPlayer } from "@/components/AudioMiniPlayer";
import { stopAudioOnNavigate } from "@/hooks/useAudioReader";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { useLanguageAutoApply } from "@/components/LanguageSwitcher";
import Home from "@/pages/Home";
import PromisePopup from "@/components/PromisePopup";
import NotFound from "@/pages/not-found";

const Archive = lazy(() => import("@/pages/Archive"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const About = lazy(() => import("@/pages/About"));
const Donate = lazy(() => import("@/pages/Donate"));
const DonationSuccess = lazy(() => import("@/pages/DonationSuccess"));
const PrayerCounseling = lazy(() => import("@/pages/PrayerCounseling"));
const MyPrayerRequests = lazy(() => import("@/pages/MyPrayerRequests"));
const SingleDevotional = lazy(() => import("@/pages/SingleDevotional"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("@/pages/TermsOfUse"));
const Disclaimer = lazy(() => import("@/pages/Disclaimer"));
const Contact = lazy(() => import("@/pages/Contact"));
const ContactCompose = lazy(() => import("@/pages/ContactCompose"));
const GeneralInquiries = lazy(() => import("@/pages/GeneralInquiries"));
const Feedback = lazy(() => import("@/pages/Feedback"));
const Partnership = lazy(() => import("@/pages/Partnership"));
const Support = lazy(() => import("@/pages/Support"));
const HowToUse = lazy(() => import("@/pages/HowToUse"));
const Bible = lazy(() => import("@/pages/Bible"));
const PublicDevotionalToday = lazy(() => import("@/pages/PublicDevotionalToday"));
const PublicArchive = lazy(() => import("@/pages/PublicArchive"));
const SundaySchool = lazy(() => import("@/pages/SundaySchool"));
const SundaySchoolLessonPage = lazy(() => import("@/pages/SundaySchoolLesson"));
const TestimonyWall = lazy(() => import("@/pages/TestimonyWall"));
const QuickPrayer = lazy(() => import("@/pages/QuickPrayer"));
const DailyPromise = lazy(() => import("@/pages/DailyPromise"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const LoopNestRoot = lazy(() => import("@/loopnest/LoopNestRoot"));
const LoopNestLogin = lazy(() => import("@/loopnest/LoginPage"));
const LoopNestDashboard = lazy(() => import("@/loopnest/DashboardPage"));
const LoopNestBuilder = lazy(() => import("@/loopnest/BuilderPage"));
const GamePage = lazy(() => import("@/game-engine").then((module) => ({ default: module.GamePage })));
const GamesHub = lazy(() => import("@/game-engine").then((module) => ({ default: module.GamesHub })));
const CreateGamePage = lazy(() => import("@/game-engine").then((module) => ({ default: module.CreateGamePage })));
const LoopNestAuthProvider = lazy(() => import("@/loopnest/AuthContext").then((module) => ({ default: module.LoopNestAuthProvider })));

function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center" data-testid="route-loader">
      <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  );
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AppErrorBoundary] Route render failed", error, errorInfo);
  }

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground" data-testid="app-error-fallback">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The page could not finish rendering, but the app is still available. You can safely return home or reload this view.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={this.handleGoHome} className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                Go to Home
              </button>
              <button type="button" onClick={this.handleReload} className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/archive" component={Archive} />
        <Route path="/admin" component={Admin} />
        <Route path="/about" component={About} />
        <Route path="/donate" component={Donate} />
        <Route path="/donation-success" component={DonationSuccess} />
        <Route path="/prayer-counseling" component={PrayerCounseling} />
        <Route path="/my-requests" component={MyPrayerRequests} />
        <Route path="/testimonies" component={TestimonyWall} />
        <Route path="/quick-prayer" component={QuickPrayer} />
        <Route path="/daily-promise" component={DailyPromise} />
        <Route path="/devotional/today" component={PublicDevotionalToday} />
        <Route path="/devotional/:date" component={SingleDevotional} />
        <Route path="/public/archive" component={PublicArchive} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-use" component={TermsOfUse} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route path="/contact" component={Contact} />
        <Route path="/contact/compose" component={ContactCompose} />
        <Route path="/contact/general" component={GeneralInquiries} />
        <Route path="/contact/feedback" component={Feedback} />
        <Route path="/contact/partnership" component={Partnership} />
        <Route path="/prayer" component={PrayerCounseling} />
        <Route path="/support" component={Support} />
        <Route path="/how-to-use" component={HowToUse} />
        <Route path="/bible" component={Bible} />
        <Route path="/sunday-school/:id" component={SundaySchoolLessonPage} />
        <Route path="/sunday-school" component={SundaySchool} />
        <Route path="/inbox" component={Inbox} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/interactive" component={GamesHub} />
        <Route path="/interactive/create" component={CreateGamePage} />
        <Route path="/interactive/:gameSlug" component={GamePage} />
        <Route path="/loopnest" component={LoopNestRoot} />
        <Route path="/loopnest/login" component={LoopNestLogin} />
        <Route path="/loopnest/dashboard" component={LoopNestDashboard} />
        <Route path="/loopnest/builder" component={LoopNestBuilder} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function LoopNestShell() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <LoopNestAuthProvider>
        <Router />
      </LoopNestAuthProvider>
    </Suspense>
  );
}

function AppContent() {
  useOfflineSync();
  useLanguageAutoApply();
  const { isTransitioning, completeTransition } = useMenuTransition();
  const [location] = useLocation();

  useEffect(() => {
    stopAudioOnNavigate();
  }, [location]);

  const isPublicRoute =
    location.startsWith("/devotional") || location.startsWith("/public") || location.startsWith("/interactive") || location.startsWith("/loopnest");

  if (location.startsWith("/loopnest")) {
    return <LoopNestShell />;
  }

  if (isPublicRoute) {
    return <Router />;
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-6 pb-12 sm:pt-8 sm:pb-16">
          <Router />
        </main>
        <Footer />
        <Toaster />
        <NotificationPrompt />
        <NotificationTrigger />
        <PromisePopup />
        <WalkthroughModal />
        <FloatingFeedbackButton />
        <AudioMiniPlayer />
      </div>
      <MenuTransitionOverlay isVisible={isTransitioning} onComplete={completeTransition} />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <TranslationProvider>
                <FontSizeProvider>
                  <MenuTransitionProvider>
                    <TooltipProvider>
                      <AppErrorBoundary>
                        <AppContent />
                      </AppErrorBoundary>
                    </TooltipProvider>
                  </MenuTransitionProvider>
                </FontSizeProvider>
              </TranslationProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
