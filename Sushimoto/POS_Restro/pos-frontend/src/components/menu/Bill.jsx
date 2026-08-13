import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import {
  addOrder,
  createOrderRazorpay,
  updateTable,
  verifyPaymentRazorpay,
} from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Bill = () => {
  const dispatch = useDispatch();
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const taxRate = 5.25;
  const tax = (total * taxRate) / 100;
  const totalPriceWithTax = total + tax;

  const [paymentMethod, setPaymentMethod] = useState();
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      enqueueSnackbar("Please select a payment method!", { variant: "warning" });
      return;
    }

    const orderPayload = {
      customerDetails: {
        name: customerData.customerName,
        phone: customerData.customerPhone,
        guests: customerData.guests,
      },
      orderStatus: "In Progress",
      bills: { total, tax, totalWithTax: totalPriceWithTax },
      items: cartData,
      table: customerData.table?.tableId,
      paymentMethod,
    };

    if (paymentMethod === "Online") {
      try {
        const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!loaded) {
          enqueueSnackbar("Razorpay SDK failed to load", { variant: "warning" });
          return;
        }

        const { data } = await createOrderRazorpay({ amount: totalPriceWithTax.toFixed(2) });

        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "Sushimoto",
          description: "Secure Payment",
          order_id: data.order.id,
          handler: async function (response) {
            await verifyPaymentRazorpay(response);
            orderPayload.paymentData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
            };
            setTimeout(() => orderMutation.mutate(orderPayload), 1500);
          },
          prefill: { name: customerData.customerName, contact: customerData.customerPhone },
          theme: { color: "#b1454a" },
        });
        rzp.open();
      } catch (error) {
        enqueueSnackbar("Payment Failed!", { variant: "error" });
      }
    } else {
      orderMutation.mutate(orderPayload);
    }
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;
      setOrderInfo(data);
      const tableData = { status: "Booked", orderId: data._id, tableId: data.table };
      setTimeout(() => tableUpdateMutation.mutate(tableData), 1500);
      enqueueSnackbar("Order Placed!", { variant: "success" });
      setShowInvoice(true);
    },
    onError: () => enqueueSnackbar("Failed to place order", { variant: "error" }),
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: () => {
      dispatch(removeCustomer());
      dispatch(removeAllItems());
    },
  });

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground font-body text-xs">Items ({cartData.length})</p>
        <h1 className="text-secondary font-heading font-bold text-sm">₹{total.toFixed(2)}</h1>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground font-body text-xs">Tax (5.25%)</p>
        <h1 className="text-secondary font-heading font-bold text-sm">₹{tax.toFixed(2)}</h1>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground font-body text-xs">Total With Tax</p>
        <h1 className="text-primary font-heading font-bold text-base">₹{totalPriceWithTax.toFixed(2)}</h1>
      </div>

      <div className="flex gap-2">
        {["Cash", "Online"].map((method) => (
          <button
            key={method}
            onClick={() => setPaymentMethod(method)}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-body font-medium border transition-all ${
              paymentMethod === method
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2.5 rounded-full text-sm font-body font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
          Print
        </button>
        <button
          onClick={handlePlaceOrder}
          className="flex-1 px-3 py-2.5 rounded-full text-sm font-body font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
        >
          Place Order
        </button>
      </div>

      {showInvoice && <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />}
    </div>
  );
};

export default Bill;
