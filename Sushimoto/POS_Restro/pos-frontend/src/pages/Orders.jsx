import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack";

const statusFilters = [
  { key: "all", label: "All" },
  { key: "progress", label: "In Progress" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
];

const Orders = () => {
  const [status, setStatus] = useState("all");
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    document.title = "Sushimoto | Orders";
  }, []);

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => getOrders(),
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  return (
    <section className="h-[calc(100vh-5rem)] overflow-hidden pb-20">
      <div className="flex items-center justify-between px-8 py-4" data-aos="fade-down">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-secondary text-2xl font-heading font-bold">Orders</h1>
        </div>
        <div className="flex items-center gap-2">
          {statusFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`font-body text-sm font-medium px-5 py-2 rounded-full transition-all ${
                status === key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-secondary bg-white border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 px-8 py-2 overflow-y-scroll max-h-[calc(100vh-200px)] custom-scrollbar">
        {resData?.data?.data?.length > 0 ? (
          resData.data.data.map((order) => (
            <div key={order._id} data-aos="fade-up">
              <OrderCard order={order} />
            </div>
          ))
        ) : (
          <p className="col-span-3 text-muted-foreground font-body text-center py-16">
            No orders available
          </p>
        )}
      </div>

      {!isAdmin && <BottomNav />}
    </section>
  );
};

export default Orders;
