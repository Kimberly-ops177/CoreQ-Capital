/**
 * Pagination utility for consistent pagination across all controllers
 */

/**
 * Get pagination parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} Pagination parameters
 */
const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

/**
 * Format paginated response
 * @param {Array} data - Array of data items
 * @param {Number} total - Total count of items
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @returns {Object} Formatted pagination response
 */
const formatPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse
};
