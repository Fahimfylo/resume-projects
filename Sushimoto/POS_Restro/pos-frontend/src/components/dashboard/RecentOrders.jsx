import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders, updateOrderStatus } from "../../https/index";
import { formatDateAndTime } from "../../utils";

const RecentOrders = () => {
  const queryClient = useQueryClient();

  const orderStatusUpdateMutation = useMutation({
    mutationFn: ({ orderId, orderStatus }) => updateOrderStatus({ orderId, orderStatus }),
    onSuccess: () => {
      enqueueSnackbar("Order status updated!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => {
      enqueueSnackbar("Failed to update status", { variant: "error" });
    },
  });

  const handleStatusChange = (orderId, orderStatus) => {
    orderStatusUpdateMutation.mutate({ orderId, orderStatus });
  };

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => getOrders(),
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  const tableHeadClass = "p-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider";
  const tableDataClass = "p-3 text-sm font-body text-secondary";

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm" data-aos="fade-up">
      <h2 className="text-xl font-heading font-semibold text-secondary px-6 py-4">
        Recent Orders
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-y border-border">
            <tr>
              <th className={tableHeadClass}>Order ID</th>
              <th className={tableHeadClass}>Customer</th>
              <th className={tableHeadClass}>Status</th>
              <th className={tableHeadClass}>Date & Time</th>
              <th className={tableHeadClass}>Items</th>
              <th className={tableHeadClass}>Table</th>
              <th className={tableHeadClass}>Total</th>
              <th className={`${tableHeadClass} text-center`}>Payment</th>
            </tr>
          </thead>
          <tbody>
            {resData?.data?.data?.length > 0 ? (
              resData.data.data.map((order, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className={tableDataClass}>
                    #{Math.floor(new Date(order.orderDate).getTime()).toString().slice(-8)}
                  </td>
                  <td className={tableDataClass}>{order.customerDetails.name}</td>
                  <td className="p-3">
                    <select
                      className={`border border-border rounded-lg px-2.5 py-1.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring bg-white ${
                        order.orderStatus === "Ready" ? "text-green-600" : "text-yellow-600"
                      }`}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Ready">Ready</option>
                    </select>
                  </td>
                  <td className={tableDataClass}>{formatDateAndTime(order.orderDate)}</td>
                  <td className={tableDataClass}>{order.items.length} Items</td>
                  <td className={tableDataClass}>Table {order.table?.tableNo || "—"}</td>
                  <td className={`${tableDataClass} font-semibold`}>
                    ₹{order.bills?.totalWithTax?.toFixed(2)}
                  </td>
                  <td className={`${tableDataClass} text-center`}>
                    <span className="bg-primary/10 text-primary text-xs font-body font-medium px-3 py-1 rounded-full">
                      {order.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground font-body text-sm">
                  No orders available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
