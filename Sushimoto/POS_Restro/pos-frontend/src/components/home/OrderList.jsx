import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { getAvatarName } from "../../utils/index";

const OrderList = ({ order }) => {
  return (
    <div className="flex items-center gap-4 mb-3 py-2 border-b border-border/50 last:border-b-0">
      <button className="bg-primary/10 text-primary font-heading font-bold p-3 text-base rounded-lg min-w-[44px]">
        {getAvatarName(order.customerDetails.name)}
      </button>
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col items-start gap-0.5">
          <h1 className="text-secondary text-base font-body font-semibold">
            {order.customerDetails.name}
          </h1>
          <p className="text-muted-foreground text-xs font-body">{order.items.length} Items</p>
        </div>

        <span className="text-primary font-body text-sm font-medium border border-primary/30 rounded-lg px-2.5 py-1">
          Table <FaLongArrowAltRight className="text-muted-foreground ml-1 inline" />{" "}
          {order.table?.tableNo || "—"}
        </span>

        <div className="flex flex-col items-end gap-1">
          {order.orderStatus === "Ready" ? (
            <span className="text-green-600 bg-green-100 px-2.5 py-1 rounded-full text-xs font-body font-medium">
              <FaCheckDouble className="inline mr-1" /> {order.orderStatus}
            </span>
          ) : (
            <span className="text-yellow-600 bg-yellow-100 px-2.5 py-1 rounded-full text-xs font-body font-medium">
              <FaCircle className="inline mr-1" /> {order.orderStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
