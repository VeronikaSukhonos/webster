interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
}

interface SortResponse {
  sort: string;
  order: 'asc' | 'desc';
}

interface FilterResponse {
  [param: string]: any;
}

export interface QueryResponse {
  pagination?: PaginationResponse;
  sort?: SortResponse;
  filters?: FilterResponse[];
  [entity: string]: any;
}
