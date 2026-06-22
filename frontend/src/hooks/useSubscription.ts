import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

export const useSubscription = () => {
  const user = useSelector(selectUser);
  
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
