import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { deductCredits } from "../api/mutation";
import useStore from "../store/store";

const useCreditDeduction = () => {
  const { refreshUser } = useStore();

  const mutation = useMutation({
    mutationFn: deductCredits,
    onSuccess: async (data, variables) => {
      const store = useStore.getState();
      if (data?.credits) {
        store.updateCredits(data.credits);
      }
      await refreshUser();
      store.incrementCreditHistoryRefreshKey();
    },
    onError: (error) => {
      const errData = error?.response?.data || {};
      if (errData.error === "INSUFFICIENT_FUNDS" && errData.details?.type) {
        toast.error(`Insufficient ${errData.details.type} credits.`);
      } else if (errData.error === "INSUFFICIENT_FUNDS") {
        toast.error("Insufficient credits.");
      }
    },
  });

  // function to trigger the mutation
  const deductCredit = async ({ type, quantity }) => {
    // console.log(`[CREDIT DEDUCTION] ▶️ Starting: type=${type}, quantity=${quantity}`);
    const result = await mutation.mutateAsync({ type, quantity });
    // console.log(`[CREDIT DEDUCTION] ✔️ Completed: type=${type}, quantity=${quantity}`);
    return result;
  };

  return {
    deductCredit,
    isLoading: mutation.isPending,
    isError: mutation.isError,
  };
};

export default useCreditDeduction;
