import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminComponent from "../AdminComponent";
import {
  Users,
  TrendingUp,
  DollarSign,
  Layers,
  Zap,
  Award,
  Crown,
  Wrench,
  AlertCircle,
  UserX,
  Clock,
  PieChart,
  CreditCard,
} from "lucide-react";
import {
  getTotalUsers,
  getTotalCompletedTransactions,
  getPlanData,
  getKpiSummary,
  getRevenueOverTime,
  getUserSignupsOverTime,
  getTransactionBreakdown,
  getSubscriptionBreakdown,
  getBillingCycleDistribution,
  getUserPlanDistribution,
  getPaymentGatewayRevenue,
} from "./apiService.js";
import RevenueChart from "./charts/RevenueChart";
import UserGrowthChart from "./charts/UserGrowthChart";
import PieChartCard from "./charts/PieChartCard";
import BarChartCard from "./charts/BarChartCard";
import ChartCard from "./charts/ChartCard";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    totalUsers: null,
    totalTransactions: null,
    totalAmount: null,
    plans: null,
    kpi: null,
    revenueOverTime: [],
    userSignups: [],
    transactionBreakdown: null,
    subscriptionBreakdown: null,
    billingCycle: null,
    userPlanDistribution: null,
    paymentGatewayRevenue: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usersData,
          transactionsData,
          planData,
          kpi,
          revenueOverTime,
          userSignups,
          transactionBreakdown,
          subscriptionBreakdown,
          billingCycle,
          userPlanDistribution,
          paymentGatewayRevenue,
        ] = await Promise.all([
          getTotalUsers(),
          getTotalCompletedTransactions(),
          getPlanData(),
          getKpiSummary(),
          getRevenueOverTime(),
          getUserSignupsOverTime(),
          getTransactionBreakdown(),
          getSubscriptionBreakdown(),
          getBillingCycleDistribution(),
          getUserPlanDistribution(),
          getPaymentGatewayRevenue(),
        ]);

        setData({
          totalUsers: usersData.totalUsers,
          totalTransactions: transactionsData.totalCount,
          totalAmount: transactionsData.totalAmount,
          plans: planData,
          kpi,
          revenueOverTime,
          userSignups,
          transactionBreakdown,
          subscriptionBreakdown,
          billingCycle,
          userPlanDistribution,
          paymentGatewayRevenue,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AdminComponent>
      <div className="bg-transparent min-h-screen">
        {/* Header Section */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Overview</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time performance and subscription analytics.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Live Services Active</span>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center text-red-700 dark:text-red-400">
            <AlertCircle className="mr-3" size={20} />
            <span className="font-medium">System Error: {error}</span>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5 mb-10">
          <KPICard
            title="Total Users"
            value={data.kpi?.totalUsers ?? data.totalUsers}
            icon={Users}
            percentage={data.kpi?.totalUsersPct}
            loading={loading}
          />
          <KPICard
            title="Total Revenue"
            value={data.kpi?.totalRevenue ?? data.totalAmount}
            isCurrency
            icon={DollarSign}
            percentage={data.kpi?.totalRevenuePct}
            loading={loading}
          />
          <KPICard
            title="Sales Volume"
            value={data.kpi?.totalTransactions ?? data.totalTransactions}
            icon={TrendingUp}
            percentage={data.kpi?.totalTransactionsPct}
            loading={loading}
          />
          <KPICard
            title="Active Subs"
            value={data.kpi?.activeSubscriptions}
            icon={CreditCard}
            percentage={null}
            loading={loading}
          />
          <KPICard
            title="Blocked Users"
            value={data.kpi?.blockedUsers}
            icon={UserX}
            percentage={null}
            loading={loading}
          />
          <KPICard
            title="Pending Requests"
            value={data.kpi?.pendingRedemptions}
            icon={Clock}
            percentage={null}
            loading={loading}
          />
        </div>

        {/* Charts Section */}
        <div className="space-y-6 mb-12">
          {/* Row 1: Revenue + User Signups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={data.revenueOverTime} loading={loading} />
            <UserGrowthChart data={data.userSignups} loading={loading} />
          </div>

          {/* Row 2: Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ChartCard title="Revenue by Plan" subtitle="Per plan type" icon={PieChart} iconColor="text-violet-600 dark:text-violet-400" iconBg="bg-violet-50 dark:bg-violet-900/30">
              <PieChartCard data={data.userPlanDistribution} loading={loading} emptyMessage="No plan data" />
            </ChartCard>
            <ChartCard title="Transaction Status" subtitle="Current breakdown" icon={Layers} iconColor="text-amber-600 dark:text-amber-400" iconBg="bg-amber-50 dark:bg-amber-900/30">
              <PieChartCard data={data.transactionBreakdown} loading={loading} emptyMessage="No transactions" />
            </ChartCard>
            <ChartCard title="Subscription Status" subtitle="Current breakdown" icon={CreditCard} iconColor="text-rose-600 dark:text-rose-400" iconBg="bg-rose-50 dark:bg-rose-900/30">
              <PieChartCard data={data.subscriptionBreakdown} loading={loading} emptyMessage="No subscriptions" />
            </ChartCard>
          </div>

          {/* Row 3: Bar Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Billing Cycle" subtitle="Subscription billing distribution" icon={Layers} iconColor="text-sky-600 dark:text-sky-400" iconBg="bg-sky-50 dark:bg-sky-900/30">
              <BarChartCard data={data.billingCycle} loading={loading} emptyMessage="No billing data" />
            </ChartCard>
            <ChartCard title="Payment Gateway Revenue" subtitle="Revenue by gateway" icon={DollarSign} iconColor="text-emerald-600 dark:text-emerald-400" iconBg="bg-emerald-50 dark:bg-emerald-900/30">
              <BarChartCard data={data.paymentGatewayRevenue} loading={loading} emptyMessage="No gateway data" labelKey="gateway" valueKey="revenue" valuePrefix="$" colorIndex={2} />
            </ChartCard>
          </div>
        </div>

        {/* Subscriptions Section */}
        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-10 transition-all duration-300">
          <div className="flex items-center mb-10">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mr-5 border border-indigo-100 dark:border-indigo-800/30 transition-colors">
              <Layers className="text-indigo-600 dark:text-indigo-400" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Subscription Analytics</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500">Breakdown of active customer plans.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            <SubMetric label="Free Plan" value={data.plans?.free} icon={Zap} color="text-sky-500" bg="bg-sky-50 dark:bg-sky-900/20" className="shadow-md" onClick={() => navigate('/admin/plans')}/>
            <SubMetric label="Basic" value={data.plans?.basic} icon={Award} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" onClick={() => navigate('/admin/plans')} />
            <SubMetric label="Professional" value={data.plans?.professional} icon={Layers} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/20" onClick={() => navigate('/admin/plans')} />
            <SubMetric label="Premium" value={data.plans?.premium} icon={Crown} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" onClick={() => navigate('/admin/plans')} />
            <SubMetric label="Custom" value={data.plans?.custom} icon={Wrench} color="text-slate-500" bg="bg-slate-50 dark:bg-slate-900/20" onClick={() => navigate('/admin/plans')} />
          </div>
        </div>
      </div>
    </AdminComponent>
  );
}

// --- Specialized Styled Components ---

const KPICard = ({ title, value, icon: Icon, isCurrency, percentage, loading }) => {
  const prefix = percentage && parseFloat(percentage) >= 0 ? "+" : "";
  return (
    <div className="relative overflow-hidden bg-[#0581C8] p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform duration-300">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      <div className="relative z-10 flex justify-between items-start">
        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-[1rem] border border-white/30 shadow-inner">
          <Icon className="text-white" size={22} />
        </div>
        {percentage != null && (
          <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/10">
            {prefix}{percentage}%
          </span>
        )}
      </div>
      <div className="mt-5 relative z-10">
        <p className="text-blue-50 text-sm font-medium opacity-80 uppercase tracking-widest">
          {title}
        </p>
        <h2 className="text-3xl font-black text-white mt-1.5">
          {loading ? (
            <div className="h-9 w-28 bg-white/20 animate-pulse rounded-lg" />
          ) : (
            `${isCurrency ? '$' : ''}${(value ?? 0)?.toLocaleString() ?? '0'}`
          )}
        </h2>
      </div>
    </div>
  );
};

const SubMetric = ({ label, value, icon: Icon, color, bg, onClick }) => (
  <div
    className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl transition-all hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-none cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center gap-4 mb-5">
      <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">{label}</span>
    </div>
    <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
      {value ?? '0'}
      <span className="text-[10px] text-slate-400 font-medium">units</span>
    </div>
  </div>
);
