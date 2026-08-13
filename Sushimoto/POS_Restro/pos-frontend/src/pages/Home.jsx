import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";

const Home = () => {
  useEffect(() => {
    document.title = "Sushimoto | Dashboard";
  }, []);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/dashboard");

  return (
    <section className="h-[calc(100vh-5rem)] overflow-hidden flex gap-6 p-6 pb-20">
      {/* Left */}
      <div className="flex-[3]" data-aos="fade-right">
        <Greetings />
        <div className="flex items-center w-full gap-5 mt-6">
          <MiniCard title="Total Earnings" icon={<BsCashCoin />} number={512} footerNum={1.6} />
          <MiniCard title="In Progress" icon={<GrInProgress />} number={16} footerNum={3.6} />
        </div>
        <RecentOrders />
      </div>
      {/* Right */}
      <div className="flex-[2]" data-aos="fade-left">
        <PopularDishes />
      </div>
      {!isAdmin && <BottomNav />}
    </section>
  );
};

export default Home;
