// ─── usePagination ────────────────────────────────────────────────────────
// Standard pagination state manager — pass the returned object directly to DataTable
import { useState } from "react";

export const usePagination = (defaultPageSize = 25) => {
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [total,    setTotal]    = useState(0);

  const resetPage = () => setPage(1);

  const onPageChange = (p) => setPage(p);
  const onPageSizeChange = (s) => { setPageSize(s); setPage(1); };

  return {
    page,
    pageSize,
    total,
    setTotal,
    resetPage,
    onPageChange,
    onPageSizeChange,
    // Spread this into DataTable's pagination prop:
    paginationProps: { page, pageSize, total, onPageChange, onPageSizeChange },
    // Query params to append to API calls:
    queryParams: { page, limit: pageSize },
  };
};
