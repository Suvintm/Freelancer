import { useState } from "react";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";

const ExploreEditorsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090B] light:bg-[#FAFAFA] text-white light:text-zinc-900 transition-colors duration-200">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 md:ml-64 md:mt-16 w-full">
        <ExploreEditor />
      </main>
    </div>
  );
};

export default ExploreEditorsPage;
