import { useState } from "react";
import { useSelector } from "react-redux";
import { formatDate, getAvatarName } from "../../utils";

const CustomerInfo = () => {
  const [dateTime] = useState(new Date());
  const customerData = useSelector((state) => state.customer);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-col items-start">
        <h1 className="text-secondary font-body font-semibold text-sm">
          {customerData.customerName || "Customer Name"}
        </h1>
        <p className="text-muted-foreground font-body text-xs mt-0.5">
          #{customerData.orderId || "N/A"} &middot; Dine in
        </p>
        <p className="text-muted-foreground font-body text-xs mt-1">
          {formatDate(dateTime)}
        </p>
      </div>
      <div className="bg-primary/10 text-primary font-heading font-bold text-base rounded-xl w-11 h-11 flex items-center justify-center">
        {getAvatarName(customerData.customerName) || "CN"}
      </div>
    </div>
  );
};

export default CustomerInfo;
