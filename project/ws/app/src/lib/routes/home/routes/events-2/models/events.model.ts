export namespace events {
  export interface tableData {
    columns: columnData[],
    showSearchBox: boolean,
    showPagination: boolean,
    noDataMessage?: string
  }

  export interface columnData {
    displayName: string,
    key: string,
    cellType: string,
    imageKey?: string,
    cellClass?: string
  }

  export interface pagination {
    startIndex: number,
    lastIndex: number,
    pageSize: number,
    pageIndex: number,
    totalCount: number,
  }

  export interface menuItems {
    icon?: string,
    btnText: string,
    action: string,
  }

  export const IMAGE_MAX_SIZE = (400 * 1024 * 1024)
}

export interface speaker {
  name: string,
  email: string,
  description: string
}

export interface material {
  fullName: string,
  fileUrl: string
}