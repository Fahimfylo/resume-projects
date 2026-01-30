import { Outlet } from "react-router-dom";
import ShoppingHeader from "./header";
import Footer from "./Footer";

function ShoppingLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">
      {/* Common Header */}
      <ShoppingHeader />

      {/* Main Content */}
      <main className="flex flex-col w-full flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default ShoppingLayout;
