import { useQuery } from "@tanstack/react-query";
import { MdGroup, MdDeliveryDining } from "react-icons/md";
import { useSelector } from "react-redux";
import { axiosWrapper } from "../../https/axiosWrapper";

const roleColors = {
  superadmin: "bg-red-50 text-red-600",
  admin: "bg-purple-50 text-purple-600",
  manager: "bg-blue-50 text-blue-600",
  chef: "bg-orange-50 text-orange-600",
  cashier: "bg-green-50 text-green-600",
  waiter: "bg-yellow-50 text-yellow-600",
  delivery: "bg-teal-50 text-teal-600",
};

const staffRoles = ["superadmin", "admin", "manager", "chef", "cashier", "waiter", "delivery"];

export default function AdminStaff() {
  const currentRole = useSelector((state) => state.user.role)?.toLowerCase();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => axiosWrapper.get("/api/admin/users?limit=100").then((r) => r.data?.data || { users: [], total: 0 }),
  });

  const allUsers = data?.users || [];
  const staff = allUsers.filter((u) => staffRoles.includes(u.role));
  const riders = staff.filter((u) => u.role === "delivery");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-secondary flex items-center gap-3">
          <MdGroup className="text-primary" /> Staff
        </h1>
        <p className="text-sm text-muted-foreground font-body mt-1">All staff members and delivery personnel</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground font-body">Loading...</div>
      ) : (
        <div className="space-y-8">
          {/* Staff table */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody>
                {!staff.length ? (
                  <tr><td colSpan={4} className="text-center py-16 text-muted-foreground font-body">No staff found</td></tr>
                ) : (
                  staff.map((user) => (
                    <tr key={user._id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{user.name?.[0]?.toUpperCase() || "U"}</div>
                          <span className="font-medium text-secondary">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-5 py-4 text-muted-foreground">{user.phone || "-"}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${roleColors[user.role] || "bg-gray-50 text-muted-foreground"}`}>
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Riders */}
          <div>
            <h2 className="text-xl font-heading font-semibold text-secondary mb-4 flex items-center gap-2">
              <MdDeliveryDining className="text-teal-500" /> Delivery Riders
            </h2>
            {!riders.length ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-border shadow-sm">
                <p className="text-muted-foreground font-body">No riders assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {riders.map((rider) => (
                  <div key={rider._id} className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 text-lg font-bold flex-none">
                      {rider.name?.[0]?.toUpperCase() || "D"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary">{rider.name}</p>
                      <p className="text-xs text-muted-foreground">{rider.phone || "No phone"}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-600 capitalize font-medium flex-none">Rider</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
