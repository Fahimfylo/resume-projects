import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const useFetchPackages = (isAnnually, setIsLoading) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/plans/official`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("userAccessToken")}`,
          },
        });
        const fetchedPlans = response.data.plans;
        // Sort plans by price in ascending order
        const sortedPlans = fetchedPlans.sort(
          (a, b) => a.pricing.monthly.price - b.pricing.monthly.price
        );

        const recommendedPlan = sortedPlans.find((plan) => plan.recommended);
        if (recommendedPlan) {
          setSelectedPlan(recommendedPlan);
        }
        setPlans(sortedPlans);
      } catch (error) {
        // console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, [isAnnually, setIsLoading]);

  return { plans, selectedPlan, setSelectedPlan };
};

export default useFetchPackages;
