// ─── DataTable — Universal Table Component ────────────────────────────────
// Replaces all copy-paste table code across every page.
// Supports: sort, pagination, row selection, CSV export, skeleton, empty state,
// sticky header, mobile scroll, bulk actions slot.
//
// Usage:
// <DataTable
//   columns={[{ key:"name", label:"Name", sortable:true, render:(row)=><Cell/> }]}
//   data={users}
//   loading={isLoading}
//   pagination={{ page, pageSize, total, onPageChange, onPageSizeChange }}
//   onSelectionChange={setSelected}
//   onExport={handleExport}
//   bulkActions={selected.length > 0 && <BulkMenu />}
//   emptyIcon={<FaUsers/>}
//   emptyMessage="No users found"
// />
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronUp, HiChevronDown, HiDownload } from "react-icons/hi";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { SkeletonRow } from "./Skeleton";
import EmptyState from "./EmptyState";
import { PAGE_SIZES } from "../../utils/constants";

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  pagination,          // { page, pageSize, total, onPageChange, onPageSizeChange }
  onSelectionChange,   // (selectedIds) => void
  onExport,            // () => void (triggers CSV download)
  bulkActions,         // React node shown when rows are selected
  emptyIcon,
  emptyMessage = "No records found",
  emptyDescription,
  rowKey = "_id",      // key field for row identity
  stickyHeader = true,
  className = "",
}) => {
  const [sortKey,    setSortKey]    = useState(null);
  const [sortDir,    setSortDir]    = useState("asc");
  const [selected,   setSelected]   = useState(new Set());

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const toggleAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(data.map(r => r[rowKey]));
      setSelected(all);
      onSelectionChange?.(Array.from(all));
    }
  };

  const toggleRow = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const allChecked  = data.length > 0 && selected.size === data.length;
  const someChecked = selected.size > 0 && selected.size < data.length;

  const hasPagination = pagination && (pagination.total || pagination.totalItems) > 0;
  const totalRecords  = pagination?.total || pagination?.totalItems || 0;
  const itemsPerPage  = pagination?.pageSize || 10;
  const totalPages    = hasPagination ? Math.ceil(totalRecords / itemsPerPage) : 1;

  return (
    <div className={`card ${className}`} style={{ overflow: "hidden" }}>
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {bulkActions && selected.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              background: "rgba(124,58,237,0.1)",
              borderBottom: "1px solid rgba(124,58,237,0.25)",
              padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 14,
              fontSize: 13,
            }}
          >
            <span style={{ color: "var(--brand)", fontWeight: 700 }}>
              {selected.size} selected
            </span>
            {bulkActions}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table toolbar */}
      {onExport && (
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button
            onClick={onExport}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8,
              background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
              color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all var(--transition)",
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseOut={(e)  => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <HiDownload size={13} /> Export CSV
          </button>
        </div>
      )}

      {/* Scrollable table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead style={{
            background: stickyHeader ? "var(--bg-surface)" : "transparent",
            ...(stickyHeader ? { position: "sticky", top: 0, zIndex: 1 } : {}),
          }}>
            <tr>
              {onSelectionChange && (
                <th style={{ width: 40, padding: "11px 16px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked; }}
                    onChange={toggleAll}
                    style={{ cursor: "pointer", accentColor: "var(--brand)" }}
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const key = col.key || col.accessorKey || col.id || idx;
                const label = col.label || col.header || "";
                
                return (
                  <th
                    key={key}
                    onClick={() => col.sortable && handleSort(key)}
                    style={{
                      padding: "11px 16px",
                      textAlign: col.align || "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      cursor: col.sortable ? "pointer" : "default",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {label}
                      {col.sortable && (
                        <span style={{ display: "flex", flexDirection: "column", opacity: sortKey === key ? 1 : 0.3 }}>
                          <HiChevronUp  size={10} style={{ marginBottom: -3, color: sortKey === key && sortDir === "asc" ? "var(--brand)" : "inherit" }} />
                          <HiChevronDown size={10} style={{ color: sortKey === key && sortDir === "desc" ? "var(--brand)" : "inherit" }} />
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} cols={(onSelectionChange ? 1 : 0) + columns.length} />
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={(onSelectionChange ? 1 : 0) + columns.length}>
                  <EmptyState
                    icon={emptyIcon || <HiMagnifyingGlass />}
                    title={emptyMessage}
                    description={emptyDescription}
                    compact
                  />
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIdx) => {
                const id = row[rowKey] || rowIdx;
                const isSelected = selected.has(id);
                return (
                  <motion.tr
                    key={id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: rowIdx * 0.02 }}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      background: isSelected ? "rgba(124,58,237,0.06)" : "transparent",
                      transition: "background var(--transition)",
                    }}
                    onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseOut={(e)  => { e.currentTarget.style.background = isSelected ? "rgba(124,58,237,0.06)" : "transparent"; }}
                  >
                    {onSelectionChange && (
                      <td style={{ width: 40, padding: "12px 16px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          style={{ cursor: "pointer", accentColor: "var(--brand)" }}
                        />
                      </td>
                    )}
                    {columns.map((col, colIdx) => {
                      const accessor = col.key || col.accessorKey || col.id || colIdx;
                      const renderFn = col.render || col.cell;
                      // Determine the cell value
                      const cellValue = col.accessorKey ? row[col.accessorKey] : 
                                       (col.key ? row[col.key] : row);

                      return (
                        <td
                          key={accessor}
                          style={{
                            padding: "12px 16px",
                            fontSize: 13,
                            color: "var(--text-primary)",
                            textAlign: col.align || "left",
                            verticalAlign: "middle",
                            maxWidth: col.maxWidth,
                            whiteSpace: col.wrap ? "normal" : "nowrap",
                          }}
                        >
                          {renderFn ? renderFn(row, cellValue) : (cellValue ?? "—")}
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {hasPagination && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
              style={{
                background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                color: "var(--text-primary)", borderRadius: 6, padding: "3px 8px",
                fontSize: 12, cursor: "pointer",
              }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {(((pagination.page || 1) - 1) * itemsPerPage) + 1}–{Math.min((pagination.page || 1) * itemsPerPage, totalRecords)} of {totalRecords}
            </span>
          </div>

          <div style={{ display: "flex", gap: 4 }}>
            {[1, "..l", ...Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const half = 2;
              const start = Math.max(1, Math.min((pagination.page || 1) - half, totalPages - 4));
              return start + i;
            }).filter(p => p >= 1 && p <= totalPages), "..r", totalPages]
              .filter((p) => {
                if (p === 1 || p === totalPages) return true;
                if (p === "..l") return (pagination.page || 1) > 4;
                if (p === "..r") return (pagination.page || 1) < totalPages - 3;
                return typeof p === "number" && p >= 1 && p <= totalPages;
              })
              .filter((p, i, arr) => arr.indexOf(p) === i)
              .map((p) =>
                typeof p === "string" ? (
                  <span key={p} style={{ padding: "4px 8px", color: "var(--text-muted)", fontSize: 12 }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => pagination.onPageChange(p)}
                    style={{
                      minWidth: 30, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 600,
                      border: p === (pagination.page || 1) ? "1px solid var(--brand)" : "1px solid var(--border-default)",
                      background: p === (pagination.page || 1) ? "var(--brand)" : "var(--bg-elevated)",
                      color: p === (pagination.page || 1) ? "#fff" : "var(--text-secondary)",
                      cursor: "pointer", transition: "all var(--transition)",
                    }}
                  >
                    {p}
                  </button>
                )
              )
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
