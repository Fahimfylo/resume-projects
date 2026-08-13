import useStore from "../store/store";

export function useFeatureAccess() {
  const user = useStore((state) => state.user);
  const isFreeUser = !user || user?.plan?.name === "Free" || user?.plan?.type === "free";

  if (!isFreeUser) {
    return {
      limits: {},
      hasFeature: () => true,
      requireFeature: () => ({ allowed: true, message: null }),
    };
  }

  const limits = (user?.limits && Object.values(user.limits).some(Boolean))
    ? user.limits
    : user?.plan?.features?.limits || {};

  const hasFeature = (featureKey) => !!limits[featureKey];

  const requireFeature = (featureKey) => {
    const allowed = hasFeature(featureKey);
    return {
      allowed,
      message: allowed
        ? null
        : `Your plan does not include this feature. Please upgrade your plan to access it.`,
    };
  };

  return { limits, hasFeature, requireFeature };
}
