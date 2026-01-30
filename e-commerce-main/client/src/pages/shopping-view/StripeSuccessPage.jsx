import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { capturePayment } from "@/store/shop/order-slice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

function StripeSuccessPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId"); // success_url থেকে

  useEffect(() => {
    if (orderId) {
      dispatch(capturePayment({ orderId })).then((res) => {
        if (res?.payload?.success) {
          sessionStorage.removeItem("currentOrderId");
          navigate("/shop/payment-success"); // এই page দেখাবে success
        } else {
          navigate("/shop/payment-failed");
        }
      });
    }
  }, [orderId, dispatch, navigate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Payment... Please wait!</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default StripeSuccessPage;
