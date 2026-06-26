/**
 * 📊 CURSOR-BASED PAGINATION HELPER
 * 
 * Why Cursor?
 * 1. Performance: Skip/Offset is O(n), Cursor is O(1).
 * 2. Consistency: No duplicate items if new posts are added while scrolling.
 */

/**
 * Standardize the response for paginated lists
 * @param {Array} items - The items fetched (one extra already fetched to detect next page)
 * @param {number} pageSize - The requested page size
 * @param {string} cursorField - The field used for the cursor (usually 'id')
 */
export const paginate = (items, pageSize, cursorField = "id") => {
  const hasNextPage = items.length > pageSize;
  const results = hasNextPage ? items.slice(0, pageSize) : items;
  const nextCursor = hasNextPage ? results[results.length - 1][cursorField] : null;

  return {
    items: results,
    pagination: {
      nextCursor,
      hasNextPage,
      pageSize,
    },
  };
};

export default { paginate };
