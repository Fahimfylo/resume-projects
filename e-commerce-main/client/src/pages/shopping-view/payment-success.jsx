import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react"; // nice success icon
import { useNavigate } from "react-router-dom";

function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-5">
      <Card className="max-w-md w-full shadow-xl rounded-2xl border border-gray-200 overflow-hidden animate-fade-in">
        <CardContent className="flex flex-col items-center text-center p-10 space-y-6">
          <CheckCircle2 className="text-green-500 w-20 h-20 animate-bounce" />
          <CardTitle className="text-3xl font-extrabold text-gray-800">
            Payment Successful!
          </CardTitle>
          <p className="text-gray-600">
            Your payment has been processed successfully. Thank you for your
            purchase!
          </p>
          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            onClick={() => navigate("/shop/account")}
          >
            View My Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSuccessPage;
