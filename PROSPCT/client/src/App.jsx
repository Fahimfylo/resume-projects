import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useStore from "./store/store";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
const clientId =
  "904226919226-fsv2trnoq9lv8me0uampgnsdk7p7a51a.apps.googleusercontent.com";

import { Bounce, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// middlewares
import checkLoginStatus from "./utils/checkLoginStatus";
import checkAdminLoginStatus from "./utils/checkAdminLoginStatus";
import useNotificationSocket from "./utils/useNotificationSocket";
import AuthorizedRoute from "./components/layout/AuthorizedRoute";
import RequiredAuth from "./components/layout/RequiredAuth";
import SmartRedirect from "./components/layout/SmartRedirect";

// pages
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdminForgotPassword from "./pages/auth/AdminForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import LinkedinAuthSuccess from "./pages/auth/LinkedinAuthSuccess";
import VerifyEmailOTP from "./pages/auth/VerifyEmailOTP";
import Dashboard from "./pages/dashboard/Dashboard";
import SearchPage from "./pages/dashboard/SearchPage";
import ContactPage from "./pages/dashboard/ContactPage";
import ImportPage from "./pages/dashboard/ImportPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ListsPage from "./pages/dashboard/ListsPage";
import CompanyPage from "./pages/dashboard/CompanyPage";
import EnrichPage from "./pages/dashboard/EnrichPage";
import VerifyPage from "./pages/dashboard/VerifyPage";
import BillingPage from "./pages/dashboard/BillingPage";
import FastSpringCheckoutPage from "./pages/payment/FastSpringCheckoutPage";
import VoucherThankYouPage from "./pages/payment/VoucherThankYouPage";
import RedeemPage from "./pages/payment/RedeemPage";
import StripeProvider from "./payment/provider/StripeProvider";
import AdminAuth from "./components/layout/AdminAuth";
import AdminDashboard from "./components/admin/dashboard/AdminDashboard";
import AdminLogin from "./pages/auth/AdminLogin";
import ViewUsers from "./components/admin/users/ViewUsers";
import ViewTeams from "./components/admin/users/ViewTeams";
import TeamDetails from "./components/admin/users/TeamDetails";
import JoinTeam from "../src/pages/dashboard/JoinTeam";

import UpdateUser from "./components/admin/users/UpdateUser";
import AddUser from "./components/admin/users/AddUser";
import ViewAdmins from "./components/admin/admin/ViewAdmins";
import AddAdmin from "./components/admin/admin/AddAdmin";
import UpdateAdmin from "./components/admin/admin/UpdateAdmin";

import ViewPlans from "./components/admin/plan/ViewPlans";
import AddPlan from "./components/admin/plan/AddPlan";
import UpdatePlan from "./components/admin/plan/UpdatePlan";
import ViewCustomPlans from "./components/admin/plan/ViewCustomPlans";
import UpdateCustomPlans from "./components/admin/plan/UpdateCustomPlans";
import ViewCoupons from "./components/admin/coupon/ViewCoupons";
import AddCoupon from "./components/admin/coupon/AddCoupon";
import UpdateCoupon from "./components/admin/coupon/UpdateCoupon";
import ViewSpecialDeals from "./components/admin/specialDeal/ViewSpecialDeals";
import AddSpecialDeal from "./components/admin/specialDeal/AddSpecialDeal";
import UpdateSpecialDeal from "./components/admin/specialDeal/UpdateSpecialDeal";
import SpecialDealRequests from "./components/admin/specialDeal/Requests";
import SpecialDealAssigned from "./components/admin/specialDeal/Assigned";
import VoucherRequests from "./components/admin/specialDeal/VoucherRequests";
import ViewSubscriptions from "./components/admin/subscription/ViewSubscriptions";
import AddSubscription from "./components/admin/subscription/AddSubscription";
import UpdateSubscription from "./components/admin/subscription/UpdateSubscription";
import ViewTransactions from "./components/admin/transactions/ViewTransactions";
import AddTransaction from "./components/admin/transactions/AddTransaction";
import UpdateTransaction from "./components/admin/transactions/UpdateTransaction";
import AdminSettings from "./components/admin/settings/settings";
import LayoutSettings from "./components/admin/layout/LayoutSettings";
import ImportData from "./components/admin/import/ImportData";
import RecentSearchesPage from "./pages/dashboard/RecentSearchesPage";
import SavedSearchesPage from "./pages/dashboard/SavedSearchesPage";

// Create a client
const queryClient = new QueryClient();

function App() {
  const { isLoggedIn, isAdminLoggedIn } = useStore();

  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
    }
  }, []); // Only run on mount for theme initialization

  // ✅ CRITICAL FIX: Run each check independently on mount only to prevent race conditions
  useEffect(() => {
    checkLoginStatus();
  }, []); // Only run on mount for user session

  useEffect(() => {
    checkAdminLoginStatus();
  }, []); // Only run on mount for admin session

  // Listen for server-pushed notifications via Socket.io
  useNotificationSocket();

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider>
          <Router>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              transition={Bounce}
            />
            <Routes>
              <Route path="/team/join/:token" element={<JoinTeam />} />
              {/* Public auth routes - accessible even with old tokens */}
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route element={<AuthorizedRoute />}>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
                <Route
                  path="/linkedin-auth-success"
                  element={<LinkedinAuthSuccess />}
                />
                <Route path="/verify-email" element={<VerifyEmailOTP />} />
              </Route>
              
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/smart-redirect" element={<SmartRedirect />} />
              <Route path="/redeem" element={<RedeemPage />} />

              <Route element={<RequiredAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/search/:filterName?" element={<SearchPage />} />
                <Route
                  path="/recent-searches"
                  element={<RecentSearchesPage />}
                />
                <Route path="/saved-search" element={<SavedSearchesPage />} />
                <Route path="/saved-searches" element={<SavedSearchesPage />} />
                <Route path="/contacts" element={<ContactPage />} />
                <Route path="/lists" element={<ListsPage />} />
                <Route path="/companies" element={<CompanyPage />} />
                <Route path="/enrich" element={<EnrichPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/settings/*" element={<SettingsPage />} />
                <Route path="/plans-and-billings" element={<BillingPage />} />
               <Route path="/billing/success" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/billing/cancel" element={<Navigate to="/plans-and-billings" replace />} />
                  <Route path="/fastspring-checkout" element={<FastSpringCheckoutPage />} />
                  <Route path="/thank-you" element={<VoucherThankYouPage />} />
               </Route>

              <Route element={<AdminAuth />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<ViewUsers />} />
                <Route path="/admin/users/teams" element={<ViewTeams />} />
                <Route path="/admin/users/teams/:id" element={<TeamDetails />} />
                <Route path="/admin/users/add" element={<AddUser />} />
                <Route
                  path="/admin/update-user/:userId"
                  element={<UpdateUser />}
                />
                <Route path="/admin/admins" element={<ViewAdmins />} />
                <Route path="/admin/admins/add" element={<AddAdmin />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/layout" element={<LayoutSettings />} />
                <Route path="/admin/import" element={<ImportData />} />

                <Route
                  path="/admin/update-admin/:userId"
                  element={<UpdateAdmin />}
                />
                <Route path="/admin/plans" element={<ViewPlans />} />
                <Route path="/admin/custom-plans" element={<ViewCustomPlans />} />
                <Route path="/admin/plans/add" element={<AddPlan />} />
                <Route
                  path="/admin/update-plan/:planId"
                  element={<UpdatePlan />}
                />
                <Route
                  path="/admin/update-custom-plan/:planId"
                  element={<UpdateCustomPlans />}
                />
                <Route path="/admin/coupons" element={<ViewCoupons />} />
                <Route path="/admin/coupons/add" element={<AddCoupon />} />
                <Route
                  path="/admin/update-coupon/:couponId"
                  element={<UpdateCoupon />}
                />
                <Route path="/admin/special-deals" element={<ViewSpecialDeals />} />
                <Route path="/admin/special-deals/add" element={<AddSpecialDeal />} />
                <Route path="/admin/special-deals/requests" element={<SpecialDealRequests />} />
                <Route path="/admin/special-deals/voucher-requests" element={<VoucherRequests />} />
                <Route path="/admin/special-deals/assigned" element={<SpecialDealAssigned />} />
                <Route
                  path="/admin/update-special-deal/:dealId"
                  element={<UpdateSpecialDeal />}
                />
                <Route
                  path="/admin/subscriptions"
                  element={<ViewSubscriptions />}
                />
                <Route
                  path="/admin/subscriptions/add"
                  element={<AddSubscription />}
                />
                <Route
                  path="/admin/update-subscription/:subscriptionId"
                  element={<UpdateSubscription />}
                />
                <Route
                  path="/admin/transactions"
                  element={<ViewTransactions />}
                />
                <Route
                  path="/admin/transactions/add"
                  element={<AddTransaction />}
                />
                <Route
                  path="/admin/update-transaction/:transactionId"
                  element={<UpdateTransaction />}
                />
              </Route>
            </Routes>
          </Router>
        </StripeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
