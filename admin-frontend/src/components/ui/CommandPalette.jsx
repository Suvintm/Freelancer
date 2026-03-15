import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineSquares2X2, HiOutlineUsers, HiOutlineShoppingBag, 
  HiOutlineChatBubbleLeftRight, HiOutlineChartBar, HiOutlineCog6Tooth,
  HiOutlineShieldCheck, HiOutlineArrowLeftOnRectangle, 
  HiOutlineMagnifyingGlass, HiOutlineCommandLine, HiOutlineWrench
} from "react-icons/hi2";
import { useAdmin } from "../../context/AdminContext";

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, admin } = useAdmin();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface border border-elevated rounded-2xl shadow-premium overflow-hidden animate-in zoom-in-95 duration-200">
        <Command label="Command Palette" className="flex flex-col">
          <div className="flex items-center border-b border-default px-4">
            <HiOutlineMagnifyingGlass className="text-muted" size={20} />
            <Command.Input 
              autoFocus
              placeholder="Search pages, users, or execute command..."
              className="w-full h-14 bg-transparent border-none outline-none text-sm text-primary placeholder:text-muted px-3"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-default bg-elevated px-1.5 font-mono text-[10px] font-medium text-muted opacity-100">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          <Command.List className="max-h-[350px] overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-6 text-center text-sm text-muted">
              No results found for that query.
            </Command.Empty>

            <Command.Group heading={<span className="text-[10px] font-black uppercase text-muted px-2 py-1 block">Navigation</span>}>
              <CommandItem icon={HiOutlineSquares2X2} onSelect={() => runCommand(() => navigate("/dashboard"))}>Dashboard</CommandItem>
              <CommandItem icon={HiOutlineChartBar} onSelect={() => runCommand(() => navigate("/analytics"))}>Analytics</CommandItem>
              <CommandItem icon={HiOutlineUsers} onSelect={() => runCommand(() => navigate("/users"))}>User Management</CommandItem>
              <CommandItem icon={HiOutlineShoppingBag} onSelect={() => runCommand(() => navigate("/orders"))}>Orders & Disputes</CommandItem>
              <CommandItem icon={HiOutlineChatBubbleLeftRight} onSelect={() => runCommand(() => navigate("/conversations"))}>Conversations</CommandItem>
              <CommandItem icon={HiOutlineShieldCheck} onSelect={() => runCommand(() => navigate("/kyc"))}>KYC Verification</CommandItem>
            </Command.Group>

            {admin?.role === "superadmin" && (
              <Command.Group heading={<span className="text-[10px] font-black uppercase text-muted px-2 py-1 block mt-2">Sovereign Control</span>}>
                <CommandItem icon={HiOutlineWrench} onSelect={() => runCommand(() => navigate("/settings"))}>System Settings</CommandItem>
                <CommandItem icon={HiOutlineCommandLine} onSelect={() => runCommand(() => navigate("/admin-management"))}>Fleet Management</CommandItem>
              </Command.Group>
            )}

            <Command.Group heading={<span className="text-[10px] font-black uppercase text-muted px-2 py-1 block mt-2">Account</span>}>
              <CommandItem icon={HiOutlineCog6Tooth} onSelect={() => runCommand(() => navigate("/settings"))}>Profile Settings</CommandItem>
              <CommandItem 
                icon={HiOutlineArrowLeftOnRectangle} 
                onSelect={() => runCommand(() => logout())}
                className="text-danger hover:bg-danger/10"
              >
                Sign Out
              </CommandItem>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-default px-4 py-3 bg-elevated/50 text-[10px] text-muted">
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1"><kbd className="bg-surface px-1 rounded border border-default">↑↓</kbd> Navigate</span>
               <span className="flex items-center gap-1"><kbd className="bg-surface px-1 rounded border border-default">↵</kbd> Select</span>
            </div>
            <span className="font-mono uppercase tracking-widest opacity-50">SuviX Admin v1.0</span>
          </div>
        </Command>
      </div>
      
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  );
};

const CommandItem = ({ children, icon: IconComponent, onSelect, className = "" }) => (
  <Command.Item
    onSelect={onSelect}
    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all aria-selected:bg-brand aria-selected:text-white text-secondary hover:bg-elevated ${className}`}
  >
    <IconComponent size={18} className="opacity-70 group-aria-selected:opacity-100" />
    {children}
  </Command.Item>
);

export default CommandPalette;
