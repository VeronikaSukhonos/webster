interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface SortResponse {
  sort: string;
  order: 'asc' | 'desc';
}

interface FilterResponse {
  [param: string]: unknown;
}

export interface QueryResponse {
  pagination?: PaginationResponse;
  sort?: SortResponse;
  filters?: FilterResponse[];
  [entity: string]: unknown;
}
