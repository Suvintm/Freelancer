import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { ProfileDispatcher } from '../components/profile/ProfileDispatcher';

export default function Profile() {
  const user = useSelector(selectUser);

  // In a real scenario, map user.primaryRole.category to the internal roles
  // Here we assume it's 'yt_creator' for testing if no specific role matched yet
  let role: 'yt_creator' | 'gym' | 'singer' | 'default' = 'default';
  
  if (user?.primaryRole?.category === 'yt_influencer' || user?.youtubeProfile?.length) {
    role = 'yt_creator';
  } else if (user?.primaryRole?.category === 'fitness_expert') {
    role = 'gym';
  }

  return (
    <div className="w-full">
      <ProfileDispatcher role={role} viewType="main" data={user} />
    </div>
  );
}
