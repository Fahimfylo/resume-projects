import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

// Helper function to get the auth token
const getAuthToken = () => {
  return Cookies.get("adminAccessToken");
};

// API call to fetch total users
export const getTotalUsers = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No token found, please log in.");
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/users/countTotalUsers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error("Error fetching total users: " + error.message);
  }
};

// API call to fetch total completed transactions
export const getTotalCompletedTransactions = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No token found, please log in.");
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/data/total-completed`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      "Error fetching total completed transactions: " + error.message,
    );
  }
};

// API call to fetch subscription data
export const getSubscriptionData = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No token found, please log in.");
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/api/data/subscription-stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    throw new Error("Error fetching subscription data: " + error.message);
  }
};

// API call to fetch plan data
export const getPlanData = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No token found, please log in.");
  }

  try {
    const [plansRes, customPlansRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/plans/`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${BASE_URL}/api/custom-plans/`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    
    const plans = plansRes.data.plans || [];
    const planStats = {
      free: 0,
      basic: 0,
      professional: 0,
      premium: 0,
      custom: customPlansRes.data.totalCount || customPlansRes.data.plans?.length || 0,
    };
    
    plans.forEach(plan => {
      const planName = (plan.name || "").toLowerCase();
      if (planName === 'free') {
        planStats.free += 1;
      } else if (planName === 'basic') {
        planStats.basic += 1;
      } else if (planName === 'professional') {
        planStats.professional += 1;
      } else if (planName === 'premium') {
        planStats.premium += 1;
      }
    });
    
    return planStats;
  } catch (error) {
    throw new Error("Error fetching plan data: " + error.message);
  }
};

const fetchWithAuth = async (url) => {
  const token = getAuthToken();
  if (!token) throw new Error("No token found, please log in.");
  const response = await axios.get(`${BASE_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getKpiSummary = () => fetchWithAuth("/api/data/dashboard/kpi-summary");
export const getRevenueOverTime = (months = 12) => fetchWithAuth(`/api/data/dashboard/revenue-over-time?months=${months}`);
export const getUserSignupsOverTime = (months = 12) => fetchWithAuth(`/api/data/dashboard/user-signups?months=${months}`);
export const getTransactionBreakdown = () => fetchWithAuth("/api/data/dashboard/transaction-breakdown");
export const getSubscriptionBreakdown = () => fetchWithAuth("/api/data/dashboard/subscription-breakdown");
export const getBillingCycleDistribution = () => fetchWithAuth("/api/data/dashboard/billing-cycle");
export const getUserPlanDistribution = () => fetchWithAuth("/api/data/dashboard/user-plan-distribution");
export const getPaymentGatewayRevenue = () => fetchWithAuth("/api/data/dashboard/payment-gateway-revenue");
export const getTransactionTypes = () => fetchWithAuth("/api/data/dashboard/transaction-types");
