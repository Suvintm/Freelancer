import { useUserRole } from '../hooks/useUserRole';
import { ProfileDispatcher, type UserRole } from '../components/profile/ProfileDispatcher';

export default function Profile() {
  const { user, isCreator } = useUserRole();

  const categoryStr = (user?.primaryRole?.category || '').toLowerCase();
  const categorySlugStr = (user?.primaryRole?.categorySlug || '').toLowerCase();

  let activeRole: UserRole = 'default';

  if (isCreator) {
    activeRole = 'yt_creator';
  } else if (categoryStr.includes('fitness') || categorySlugStr.includes('fitness')) {
    activeRole = 'gym';
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <ProfileDispatcher role={activeRole} viewType="main" data={user} />
    </div>
  );
}
