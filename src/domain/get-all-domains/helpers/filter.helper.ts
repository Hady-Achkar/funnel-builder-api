export const buildDomainFilters = (filters: any = {}) => {
  const whereClause: any = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.type) {
    whereClause.type = filters.type;
  }

  if (filters.hostname) {
    whereClause.hostname = {
      contains: filters.hostname,
      mode: 'insensitive',
    };
  }

  return whereClause;
};

export const buildDomainSorting = (sortBy: string = 'createdAt', sortOrder: string = 'desc') => {
  const validSortFields = ['createdAt', 'hostname', 'status'];
  const validSortOrders = ['asc', 'desc'];

  const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

  return { [field]: order };
};