import { useQuery } from "@tanstack/react-query";
import { MdPayments } from "react-icons/md";
import { axiosWrapper } from "../../https/axiosWrapper";

export default function AdminPayments() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => axiosWrapper.get("/api/payment?limit=50").then((r) => r.data?.data || { payments: [], total: 0 }),
  });

  const payments = data?.payments || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
          <MdPayments className="text-primary" /> Payments
        </h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Payment transaction history</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground font-body">Loading...</div>
      ) : !payments.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border shadow-sm">
          <MdPayments className="text-5xl text-muted mx-auto mb-3" />
          <p className="text-muted-foreground font-body">No payments recorded yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left">
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Payment ID</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Order ID</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Method</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.paymentId || "-"}</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.orderId || "-"}</td>
                  <td className="px-5 py-4 font-medium text-secondary">${(p.amount || 0).toFixed(2)}</td>
                  <td className="px-5 py-4 capitalize text-muted-foreground">{p.method || "-"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      p.status === "captured" ? "bg-green-50 text-green-600" :
                      p.status === "created" ? "bg-yellow-50 text-yellow-600" :
                      p.status === "failed" ? "bg-red-50 text-red-600" : "bg-gray-50 text-muted-foreground"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
