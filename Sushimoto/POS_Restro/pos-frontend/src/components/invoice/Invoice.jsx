import { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa6";

const Invoice = ({ orderInfo, setShowInvoice }) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => {
    const printContent = invoiceRef.current.innerHTML;
    const WinPrint = window.open("", "", "width=900,height=650");
    WinPrint.document.write(`
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; background: #fff; }
            .receipt-container { max-width: 350px; margin: 0 auto; border: 1px solid #e5e0d8; padding: 16px; border-radius: 8px; }
            h2 { font-family: 'Playfair Display', serif; color: #121212; text-align: center; }
            .text-muted { color: #888; }
            hr { border: none; border-top: 1px solid #e5e0d8; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="receipt-container">${printContent}</div>
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => { WinPrint.print(); WinPrint.close(); }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[420px] border border-border" data-aos="zoom-in">
        <div ref={invoiceRef}>
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-md bg-primary"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <FaCheck className="text-white text-2xl" />
              </motion.span>
            </motion.div>
          </div>

          <h2 className="text-xl font-heading font-bold text-secondary text-center mb-1">
            Order Receipt
          </h2>
          <p className="text-muted-foreground font-body text-sm text-center">Thank you for your order!</p>

          <div className="mt-4 border-t border-border pt-4 text-sm font-body text-secondary space-y-1">
            <p><strong>Order ID:</strong> {Math.floor(new Date(orderInfo.orderDate).getTime())}</p>
            <p><strong>Name:</strong> {orderInfo.customerDetails.name}</p>
            <p><strong>Phone:</strong> {orderInfo.customerDetails.phone}</p>
            <p><strong>Guests:</strong> {orderInfo.customerDetails.guests}</p>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <h3 className="text-sm font-heading font-semibold text-secondary mb-2">Items Ordered</h3>
            <ul className="text-sm font-body space-y-1">
              {orderInfo.items.map((item, index) => (
                <li key={index} className="flex justify-between text-xs text-secondary">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₹{item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 border-t border-border pt-3 text-sm font-body space-y-1">
            <p className="flex justify-between"><span>Subtotal:</span> <span>₹{orderInfo.bills.total.toFixed(2)}</span></p>
            <p className="flex justify-between"><span>Tax:</span> <span>₹{orderInfo.bills.tax.toFixed(2)}</span></p>
            <p className="flex justify-between font-heading font-bold text-base text-primary">
              <span>Grand Total:</span> <span>₹{orderInfo.bills.totalWithTax.toFixed(2)}</span>
            </p>
          </div>

          <div className="mt-2 text-xs font-body text-muted-foreground space-y-0.5">
            <p><strong>Payment:</strong> {orderInfo.paymentMethod}</p>
            {orderInfo.paymentMethod !== "Cash" && (
              <>
                <p><strong>Razorpay ID:</strong> {orderInfo.paymentData?.razorpay_order_id}</p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-5 border-t border-border pt-4">
          <button
            onClick={handlePrint}
            className="text-primary font-body font-semibold text-sm hover:underline px-4 py-2"
          >
            Print Receipt
          </button>
          <button
            onClick={() => setShowInvoice(false)}
            className="text-muted-foreground font-body text-sm hover:text-secondary px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
