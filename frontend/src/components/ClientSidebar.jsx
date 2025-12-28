/**
 * ClientSidebar - Advanced Client Sidebar with Grouped Navigation
 * Features: Search, Expandable Groups, Framer Motion Animations
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";
import logo from "../assets/logo.png";

// HeroIcons v2 - Outline style
import {
  HiOutlineHome,
  HiOutlineClipboardDocumentList,
  HiOutlineBriefcase,
  HiOutlineShoppingCart,
  HiOutlineUser,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentPlus,
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineUserGroup,
  HiOutlineHeart,
  HiOutlineMagnifyingGlassCircle,
  HiOutlineDocumentText,
  HiOutlineRectangleStack,
} from "react-icons/hi2";
import { FaTimes } from "react-icons/fa";

const ClientSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, backendURL } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(["dashboard"]);

  const socketContext = useSocket();
  const totalUnread = socketContext?.totalUnread || 0;

  // Fetch counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const ordersRes = await axios.get(`${backendURL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const orders = ordersRes.data.orders || [];
        const activeCount = orders.filter((o) =>
          ["in_progress", "submitted"].includes(o.status)
        ).length;
        setNewOrdersCount(activeCount);

        try {
          const unreadRes = await axios.get(`${backendURL}/api/messages/unread`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUnreadMessages(unreadRes.data.unreadCount || 0);
        } catch (err) {
          setUnreadMessages(0);
        }
      } catch (err) {
        console.error("Failed to fetch counts:", err);
      }
    };

    fetchCounts();
  }, [backendURL, user?.token]);

  const displayUnread = totalUnread > 0 ? totalUnread : unreadMessages;

  // Determine KYC status badge
  const getKycBadge = () => {
    switch (user?.clientKycStatus) {
      case "verified":
        return null;
      case "pending":
      case "under_review":
        return "⏳";
      case "rejected":
        return "❌";
      default:
        return "!";
    }
  };

  // Navigation structure with groups - memoized to prevent recalculations
  const navStructure = useMemo(() => [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: HiOutlineHome,
      path: "/client-home",
      type: "link",
    },
    {
      id: "hiring",
      label: "Hiring",
      icon: HiOutlineUserGroup,
      type: "group",
      children: [
        { path: "/explore-editors", icon: HiOutlineMagnifyingGlassCircle, label: "Explore Editors" },
        { path: "/saved-editors", icon: HiOutlineHeart, label: "Saved Editors" },
        { path: "/editors-near-you", icon: HiOutlineMapPin, label: "Editors Near You" },
      ],
    },
    {
      id: "briefs",
      label: "Briefs & Jobs",
      icon: HiOutlineClipboardDocumentList,
      type: "group",
      children: [
        { path: "/my-briefs", icon: HiOutlineRectangleStack, label: "My Briefs", isNew: true },
        { path: "/create-brief", icon: HiOutlineDocumentPlus, label: "Post Brief" },
        { path: "/post-job", icon: HiOutlineBriefcase, label: "Post Job", isNew: true },
        { path: "/my-jobs", icon: HiOutlineDocumentText, label: "My Jobs" },
      ],
    },
    {
      id: "orders",
      label: "Orders & Payments",
      icon: HiOutlineShoppingCart,
      type: "group",
      children: [
        { path: "/client-orders", icon: HiOutlineShoppingCart, label: "My Orders", badge: newOrdersCount },
        { path: "/payments", icon: HiOutlineCreditCard, label: "Payments" },
      ],
    },
    {
      id: "account",
      label: "Account",
      icon: HiOutlineUser,
      type: "group",
      children: [
        { path: "/client-profile", icon: HiOutlineUser, label: "My Profile" },
        { path: "/client-kyc", icon: HiOutlineShieldCheck, label: "KYC Verification", kycBadge: getKycBadge() },
      ],
    },
    {
      id: "messages",
      label: "Messages",
      icon: HiOutlineChatBubbleLeftRight,
      path: "/client-messages",
      type: "link",
      badge: displayUnread,
    },
  ], [newOrdersCount, displayUnread, user?.clientKycStatus]);

  // Filter navigation based on search
  const filteredNav = useMemo(() => {
    if (!searchQuery.trim()) return navStructure;

    const query = searchQuery.toLowerCase();
    return navStructure
      .map((item) => {
        if (item.type === "link") {
          return item.label.toLowerCase().includes(query) ? item : null;
        }
        if (item.type === "group") {
          const matchedChildren = item.children.filter((child) =>
            child.label.toLowerCase().includes(query)
          );
          if (matchedChildren.length > 0) {
            return { ...item, children: matchedChildren };
          }
          if (item.label.toLowerCase().includes(query)) {
            return item;
          }
        }
        return null;
      })
      .filter(Boolean);
  }, [searchQuery, navStructure]);

  // Auto-expand groups when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const groupsToExpand = filteredNav
        .filter((item) => item.type === "group")
        .map((item) => item.id);
      setExpandedGroups((prev) => {
        const newGroups = [...new Set([...prev, ...groupsToExpand])];
        // Only update if there's a change to prevent re-renders
        if (newGroups.length !== prev.length || !newGroups.every(g => prev.includes(g))) {
          return newGroups;
        }
        return prev;
      });
    }
  }, [searchQuery, filteredNav]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path) => location.pathname === path;

  const isGroupActive = (children) => children?.some((child) => isActive(child.path));

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#0a0a0c] light:bg-white text-white light:text-slate-900 shadow-xl
        flex flex-col fixed top-0 left-0 z-50 h-screen transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        w-64 border-r border-white/10 light:border-slate-200`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 light:border-slate-100">
          <img
            onClick={() => handleNavigation("/")}
            src={logo}
            className="w-9 h-9 cursor-pointer hover:scale-105 transition-transform"
            alt="SuviX"
          />
          <div className="flex-1">
            <h1
              onClick={() => handleNavigation("/")}
              className="text-lg font-bold cursor-pointer text-white light:text-slate-900"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Suvi<span className="text-emerald-500">X</span>
            </h1>
            <p className="text-[10px] text-gray-500 light:text-slate-500">Client Workspace</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-500 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-3">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 light:text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-lg text-white light:text-slate-900 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <HiOutlineXMark className="text-lg" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-1 overflow-y-auto space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;

            // Direct link item
            if (item.type === "link") {
              const active = isActive(item.path);
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  whileTap={{ scale: 0.98 }}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    active
                      ? "bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-600"
                      : "text-gray-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-50"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="clientActiveIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full"
                    />
                  )}
                  <Icon className={`text-lg ${active ? "text-emerald-500" : "text-gray-500 light:text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </motion.button>
              );
            }

            // Group with children
            if (item.type === "group") {
              const isExpanded = expandedGroups.includes(item.id);
              const groupActive = isGroupActive(item.children);

              return (
                <div key={item.id} className="space-y-0.5">
                  {/* Group Header */}
                  <motion.button
                    onClick={() => toggleGroup(item.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      groupActive
                        ? "text-emerald-400 light:text-emerald-600"
                        : "text-gray-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`text-lg ${groupActive ? "text-emerald-500" : "text-gray-500 light:text-slate-400"}`} />
                    <span>{item.label}</span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-auto"
                    >
                      <HiOutlineChevronDown className="text-sm text-gray-500" />
                    </motion.div>
                  </motion.button>

                  {/* Children */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 pl-3 border-l border-white/10 light:border-slate-200 space-y-0.5">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive = isActive(child.path);

                            return (
                              <motion.button
                                key={child.path}
                                onClick={() => handleNavigation(child.path)}
                                whileTap={{ scale: 0.98 }}
                                className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                                  childActive
                                    ? "bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-600"
                                    : "text-gray-500 light:text-slate-500 hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-50"
                                }`}
                              >
                                {childActive && (
                                  <motion.div
                                    layoutId="clientChildActiveIndicator"
                                    className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full"
                                  />
                                )}
                                <ChildIcon className={`text-base ${childActive ? "text-emerald-500" : "text-gray-600 light:text-slate-400"}`} />
                                <span>{child.label}</span>
                                {child.isNew && (
                                  <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-amber-900 rounded-full">
                                    NEW
                                  </span>
                                )}
                                {child.badge > 0 && (
                                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                                    {child.badge > 9 ? "9+" : child.badge}
                                  </span>
                                )}
                                {child.kycBadge && (
                                  <span className="ml-auto text-xs" title="KYC Status">
                                    {child.kycBadge}
                                  </span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return null;
          })}
        </nav>

        {/* Quick Stats */}
        <div className="px-3 py-2 border-t border-white/10 light:border-slate-100">
          <div className="bg-emerald-500/10 light:bg-emerald-50 p-3 rounded-lg border border-emerald-500/20 light:border-emerald-200">
            <p className="text-xs text-emerald-400 light:text-emerald-600 font-medium mb-1">Quick Stats</p>
            <div className="flex justify-between text-[11px] text-gray-400 light:text-slate-600">
              <span>Active Orders: {newOrdersCount}</span>
              <span>Messages: {displayUnread}</span>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="px-3 py-2 border-t border-white/10 light:border-slate-100">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 transition-all"
          >
            <span className="text-sm font-medium text-gray-400 light:text-slate-600">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200">
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiOutlineMoon className="text-lg text-gray-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiOutlineSun className="text-lg text-amber-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-[10px] text-gray-600 light:text-slate-400 text-center border-t border-white/10 light:border-slate-100">
          © 2024 SuviX • All rights reserved
        </div>
      </aside>
    </>
  );
};

export default ClientSidebar;
