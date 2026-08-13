import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName } from "../../utils/index";

const OrderCard = ({ order }) => {
  const isReady = order.orderStatus === "Ready";
  const bgClass = isReady ? "bg-green-50 border-green-200" : "bg-white border-border";
  const statusBg = isReady ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";

  return (
    <div className={`border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${bgClass}`}>
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 text-primary font-heading font-bold text-lg rounded-xl min-w-[48px] h-12 flex items-center justify-center">
          {getAvatarName(order.customerDetails.name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-secondary text-base font-body font-semibold">
              {order.customerDetails.name}
            </h1>
            <span className={`text-xs font-body font-medium px-3 py-1 rounded-full ${statusBg}`}>
              {isReady ? (
                <><FaCheckDouble className="inline mr-1" /> {order.orderStatus}</>
              ) : (
                <><FaCircle className="inline mr-1" /> {order.orderStatus}</>
              )}
            </span>
          </div>
          <p className="text-muted-foreground text-xs font-body mt-1">
            #{Math.floor(new Date(order.orderDate).getTime()).toString().slice(-6)} &middot; Dine in
          </p>
          <p className="text-muted-foreground text-xs font-body">
            Table <FaLongArrowAltRight className="inline mx-1" />{" "}
            {order.table?.tableNo || "—"}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 text-muted-foreground text-xs font-body">
        <span>{formatDateAndTime(order.orderDate)}</span>
        <span>{order.items.length} Items</span>
      </div>

      <hr className="my-3 border-border" />

      <div className="flex items-center justify-between">
        <span className="text-secondary font-body font-semibold">Total</span>
        <span className="text-secondary font-heading font-bold text-lg">
          ₹{order.bills?.totalWithTax?.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default OrderCard;
