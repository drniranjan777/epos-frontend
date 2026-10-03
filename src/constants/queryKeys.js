/**
 * Query key factory. Keys are hierarchical so invalidating `products.all` refreshes
 * every product list, search and detail at once.
 */
export const queryKeys = {
  products: {
    all: ['products'],
    list: (params) => ['products', 'list', params],
    search: (q) => ['products', 'search', q],
    detail: (id) => ['products', 'detail', Number(id)],
  },
  inventory: {
    all: ['inventory'],
    ledger: (params) => ['inventory', 'ledger', params],
  },
  customers: {
    all: ['customers'],
    list: (params) => ['customers', 'list', params],
    detail: (id) => ['customers', 'detail', Number(id)],
  },
  invoices: {
    all: ['invoices'],
    list: (params) => ['invoices', 'list', params],
    detail: (id) => ['invoices', 'detail', Number(id)],
  },
  masters: {
    all: ['masters'],
    list: (name, params) => ['masters', name, params ?? {}],
  },
  movements: {
    all: ['movements'],
    list: (params) => ['movements', 'list', params],
    detail: (id) => ['movements', 'detail', Number(id)],
  },
  transfers: {
    all: ['transfers'],
    list: (params) => ['transfers', 'list', params],
    detail: (id) => ['transfers', 'detail', Number(id)],
  },
  branches: { all: ['branches'], list: (params) => ['branches', 'list', params ?? {}] },
  users: { all: ['users'], list: (params) => ['users', 'list', params] },
  roles: { all: ['roles'], permissions: ['roles', 'permissions'] },
  settings: { company: ['settings', 'company'], states: ['settings', 'states'] },
  dashboard: {
    all: ['dashboard'],
    summary: ['dashboard', 'summary'],
    movement: (range) => ['dashboard', 'movement', range],
  },
  reports: {
    all: ['reports'],
    valuation: (params) => ['reports', 'valuation', params],
    movement: (params) => ['reports', 'movement', params],
  },
  audit: { list: (params) => ['audit', params] },
};
