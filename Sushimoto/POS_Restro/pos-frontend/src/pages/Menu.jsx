import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu } from "react-icons/md";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector } from "react-redux";

const Menu = () => {
  useEffect(() => {
    document.title = "Sushimoto | Menu";
  }, []);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/dashboard");

  const customerData = useSelector((state) => state.customer);

  return (
    <section className="h-[calc(100vh-5rem)] overflow-hidden flex gap-0 pb-20">
      {/* Left */}
      <div className="flex-[3]">
        <div className="flex items-center justify-between px-8 py-4" data-aos="fade-down">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-secondary text-2xl font-heading font-bold">Menu</h1>
          </div>
          <div className="flex items-center gap-3">
            <MdRestaurantMenu className="text-primary text-3xl" />
            <div className="flex flex-col items-start">
              <h1 className="text-secondary font-body font-semibold text-sm">
                {customerData.customerName || "Customer Name"}
              </h1>
              <p className="text-muted-foreground font-body text-xs">
                Table: {customerData.table?.tableNo || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <MenuContainer />
      </div>

      {/* Right — Cart Sidebar */}
      <div className="flex-[1] bg-white border-l border-border mt-4 mr-3 h-[calc(100vh-180px)] rounded-xl shadow-sm overflow-hidden">
        <CustomerInfo />
        <hr className="border-border" />
        <CartInfo />
        <hr className="border-border" />
        <Bill />
      </div>

      {!isAdmin && <BottomNav />}
    </section>
  );
};

export default Menu;
