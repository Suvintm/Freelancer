import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  HiOutlineClock,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineKey,
  HiOutlineUser,
  HiOutlinePencilSquare,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineClipboardDocumentList
} from "react-icons/hi2";
import { activityApi, adminMgmtApi } from "../api/adminApi";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import { formatDate } from "../utils/formatters";

const ACTION_CONFIG = {
  LOGIN: { icon: HiOutlineArrowLeftOnRectangle, color: "green", label: "Login" },
  LOGOUT: { icon: HiOutlineArrowRightOnRectangle, color: "secondary", label: "Logout" },
  PASSWORD_CHANGE: { icon: HiOutlineKey, color: "amber", label: "Sec Update" },
  USER_STATUS_CHANGE: { icon: HiOutlineUser, color: "blue", label: "User Mod" },
  ORDER_STATUS_CHANGE: { icon: HiOutlinePencilSquare, color: "violet", label: "Order Mod" },
  GIG_STATUS_CHANGE: { icon: HiOutlineSparkles, color: "pink", label: "Gig Mod" },
};

const Activity = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [actionFilter, setActionFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");

  // ── Data Fetching ───────────────────────────────────────────────────────
  const { data: adminData } = useQuery({
    queryKey: ["admins-list"],
    queryFn: () => adminMgmtApi.getAll().then(res => res.data.admins)
  });

  const { data: logData, isLoading } = useQuery({
    queryKey: ["activity-logs", page, pageSize, actionFilter, adminFilter],
    queryFn: () => activityApi.getLogs({ 
        page, 
        limit: pageSize, 
        action: actionFilter !== "all" ? actionFilter : undefined,
        adminId: adminFilter !== "all" ? adminFilter : undefined
    }).then(res => res.data),
    keepPreviousData: true
  });

  // ── Table Configuration ─────────────────────────────────────────────────
  const columns = [
    {
      key: "action",
      label: "Action",
      render: (row) => {
        const config = ACTION_CONFIG[row.action] || { icon: HiOutlinePencilSquare, color: "secondary", label: row.action };
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${config.color}-500/10 text-${config.color}-500 font-bold`}>
               <Icon size={16} />
            </div>
            <Badge label={config.label} variant={config.color} />
          </div>
        );
      }
    },
    {
        key: "adminName",
        label: "Administrator",
        render: (row) => (
            <div className="flex flex-col">
                <span className="text-xs font-bold text-primary">{row.adminName}</span>
                <span className="text-[10px] text-muted font-medium">{row.adminEmail}</span>
            </div>
        )
    },
    {
      key: "details",
      label: "Activity Detail",
      render: (row) => (
        <span className="text-xs text-muted font-medium italic">
          "{row.details}"
        </span>
      )
    },
    {
        key: "ip",
        label: "Context",
        render: (row) => (
            <div className="flex flex-col">
                <span className="text-[10px] font-mono text-muted">IP: {row.ip || 'Unknown'}</span>
                <span className="text-[10px] font-mono text-muted uppercase">Platform: Admin</span>
            </div>
        )
    },
    {
      key: "timestamp",
      label: "Occurred",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
            <HiOutlineClock size={14} className="text-muted" />
            <div className="flex flex-col">
                <span className="text-xs font-bold text-primary">{formatDate(row.timestamp)}</span>
                <span className="text-[10px] text-muted font-medium">
                    {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Audit Trail" 
        subtitle="Chronological log of all administrative actions and system events recorded across the platform."
        icon={HiOutlineClipboardDocumentList}
      >
        <div className="flex gap-3">
             <div className="relative">
                <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                <select 
                    className="bg-elevated border border-default rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-primary outline-none focus:border-brand cursor-pointer transition-all"
                    value={actionFilter}
                    onChange={(e) => {
                        setActionFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="all">All Actions</option>
                    {Object.keys(ACTION_CONFIG).map(action => (
                        <option key={action} value={action}>{ACTION_CONFIG[action].label}</option>
                    ))}
                </select>
             </div>

             <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                <select 
                    className="bg-elevated border border-default rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-primary outline-none focus:border-brand cursor-pointer appearance-none transition-all"
                    value={adminFilter}
                    onChange={(e) => {
                        setAdminFilter(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="all">All Administrators</option>
                    {adminData?.map(adm => (
                        <option key={adm._id} value={adm._id}>{adm.name}</option>
                    ))}
                </select>
             </div>
        </div>
      </PageHeader>

      <DataTable 
        columns={columns}
        data={logData?.logs || []}
        loading={isLoading}
        pagination={{
            page: logData?.pagination?.page || 1,
            pageSize: pageSize,
            total: logData?.pagination?.total || 0,
            onPageChange: setPage,
            onPageSizeChange: setPageSize
        }}
        onExport={() => window.print()} // Print is a simple "export" for logs
        emptyIcon={<HiOutlineClipboardDocumentList />}
        emptyMessage="No activity recorded yet"
      />
    </div>
  );
};

export default Activity;
