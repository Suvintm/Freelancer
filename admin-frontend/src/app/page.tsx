import { redirect } from 'next/navigation';

/**
 * Administrative Gateway Redirect
 * 
 * In a secure production environment, the root index is private.
 * We automatically redirect all unauthenticated root hits to the secure login gateway.
 */
export default function RootPage() {
  redirect('/auth/login');
}
