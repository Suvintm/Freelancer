import React from 'react';
import { useAppContext } from '../context/AppContext';
import Sidebar from './Sidebar';
import ClientSidebar from './ClientSidebar';
import EditorNavbar from './EditorNavbar';
import ClientNavbar from './ClientNavbar';

/**
 * UnifiedNavigation - A component that renders the correct Navbar and Sidebar
 * based on the user's role (Client or Editor).
 * 
 * @param {Object} props
 * @param {boolean} props.sidebarOpen - State to control sidebar visibility on mobile
 * @param {Function} props.setSidebarOpen - Function to toggle sidebarOpen state
 */
const UnifiedNavigation = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAppContext();
  
  // Default to Client if role is not specified, but usually we have a user
  const isEditor = user?.role === 'editor';

  return (
    <>
      {isEditor ? (
        <>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        </>
      ) : (
        <>
          <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />
        </>
      )}
    </>
  );
};

export default UnifiedNavigation;
