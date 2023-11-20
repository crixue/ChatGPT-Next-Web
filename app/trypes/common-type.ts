

export interface PageInfo<T> {
    pageNum: number,
    pageSize: number,
    size: number,
    total: number,
    pages: number,
    list: T[],
    prePage: number,
    nextPage: number,
    isFirstPage: boolean,
    isLastPage: boolean,
    hasPreviousPage: boolean,
    hasNextPage: boolean,
}

export interface TablePagination {
    current: number;
    defaultCurrent: number;
    defaultPageSize: number;
    total?: number;
}
