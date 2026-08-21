import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { ProfileDispatcher, type UserRole } from '../components/profile/ProfileDispatcher';

export default function Profile() {
  const user = useSelector(selectUser);

  const roleStr = (user?.role || '').toLowerCase();
  const categoryStr = (user?.primaryRole?.category || '').toLowerCase();
  const categorySlugStr = (user?.primaryRole?.categorySlug || '').toLowerCase();

  const isCreator =
    roleStr === 'creator' ||
    roleStr === 'yt_influencer' ||
    categoryStr === 'creator' ||
    categoryStr === 'youtube creator' ||
    categoryStr === 'yt_influencer' ||
    categorySlugStr === 'creator' ||
    categorySlugStr === 'yt_influencer' ||
    !!user?.creatorProfile ||
    !!user?.youtubeProfile?.length;

  let activeRole: UserRole = 'default';

  if (isCreator) {
    activeRole = 'yt_creator';
  } else if (categoryStr.includes('fitness') || categorySlugStr.includes('fitness')) {
    activeRole = 'gym';
  }

  return (
    <div className="w-full">
      <ProfileDispatcher role={activeRole} viewType="main" data={user} />
    </div>
  );
}
