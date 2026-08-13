import { FaSearch } from "react-icons/fa";
import OrderList from "./OrderList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";

const RecentOrders = () => {
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  return (
    <div className="mt-6">
      <div className="bg-white border border-border rounded-xl w-full shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-secondary text-lg font-heading font-semibold">Recent Orders</h1>
          <a href="" className="text-primary text-sm font-body font-semibold hover:underline">
            View all
          </a>
        </div>

        <div className="flex items-center gap-3 border border-border rounded-full px-5 py-2.5 mx-6 mb-2 bg-muted/50">
          <FaSearch className="text-muted-foreground text-sm" />
          <input
            type="text"
            placeholder="Search recent orders"
            className="bg-transparent outline-none text-secondary font-body text-sm w-full"
          />
        </div>

        <div className="mt-2 px-6 overflow-y-scroll max-h-[280px] custom-scrollbar">
          {resData?.data?.data?.length > 0 ? (
            resData.data.data.map((order) => (
              <OrderList key={order._id} order={order} />
            ))
          ) : (
            <p className="text-muted-foreground text-sm font-body py-8 text-center">
              No orders available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
