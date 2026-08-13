import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "./pages";
import {
  AdminDashboard, AdminCategories, AdminFoodItems,
  AdminUsers, AdminPayments, AdminStaff, AdminProfile,
} from "./pages/admin";
import AdminLayout from "./components/admin/AdminLayout";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";

// Adapted POS pages for admin layout (no BottomNav)
import Orders from "./pages/Orders";
import Tables from "./pages/Tables";
import Menu from "./pages/Menu";
import Home from "./pages/Home";

const STAFF_ROLES = ["superadmin", "admin", "manager", "chef", "cashier", "waiter", "delivery"];

function ProtectedAdmin({ children }) {
  const { isAuth, role } = useSelector((state) => state.user);
  if (!isAuth) return <Navigate to="/auth" />;
  if (!STAFF_ROLES.includes(role?.toLowerCase())) return <Navigate to="/" />;
  return children;
}

function App() {
  const isLoading = useLoadData();
  const { isAuth, role } = useSelector((state) => state.user);

  if (isLoading) return <FullScreenLoader />;

  const isStaff = isAuth && STAFF_ROLES.includes(role?.toLowerCase());

  return (
    <Routes>
      {/* Auth - standalone */}
      <Route path="/auth" element={isAuth ? <Navigate to={isStaff ? "/dashboard" : "/"} /> : <Auth />} />

      {/* Admin layout - full width */}
      <Route
        path="/dashboard"
        element={
          <ProtectedAdmin>
            <AdminLayout />
          </ProtectedAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="home" element={<Home />} />
        <Route path="orders" element={<Orders />} />
        <Route path="tables" element={<Tables />} />
        <Route path="menu" element={<Menu />} />
        <Route path="items" element={<AdminCategories />} />
        <Route path="items/foods" element={<AdminFoodItems />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Root - redirect staff to /dashboard */}
      <Route path="/" element={isStaff ? <Navigate to="/dashboard" /> : isAuth ? <Home /> : <Navigate to="/auth" />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={isAuth && isStaff ? "/dashboard" : isAuth ? "/" : "/auth"} />} />
    </Routes>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
