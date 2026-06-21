import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useSubscription = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  const subscription = user?.subscription;
  const tier = subscription?.tier || 'free';
  const isPremium = tier !== 'free';
  const features = subscription?.features || [];

  const hasFeature = (featureName: string) => {
    return features.includes(featureName) || features.includes('all');
  };

  return {
    subscription,
    tier,
    isPremium,
    features,
    hasFeature,
    isTrial: subscription?.isTrial || false,
    daysRemaining: subscription?.daysRemaining || 0,
  };
};
