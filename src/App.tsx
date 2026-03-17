import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import ShopNow from "./pages/ShopNow";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ShippingPolicy from "./pages/ShippingPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import Checkout from "./pages/Checkout";
import ConfirmOrder from "./pages/ConfirmOrder";
import SeedCyclingBenefits from "./pages/SeedCyclingBenefits";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import ContactUs from "./pages/ContactUs";

import { UserProvider } from "./context/UserContext";

const queryClient = new QueryClient();

// Redirect #about and #contact to clean URLs (removes hash from address bar)
function HashRedirect({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = location.hash?.toLowerCase();
    if (location.pathname === "/" && (hash === "#about" || hash === "#contact")) {
      const target = hash === "#about" ? "/about" : "/contact";
      navigate(target, { replace: true });
    }
  }, [location.pathname, location.hash, navigate]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<HashRedirect><Index /></HashRedirect>} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/shop" element={<ShopNow />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
            <Route path="/profile" element={<CustomerProfile />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirm-order/:orderId" element={<ConfirmOrder />} />
            <Route path="/seed-cycling-benefits" element={<SeedCyclingBenefits />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
