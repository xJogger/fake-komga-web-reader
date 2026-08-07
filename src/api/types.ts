export interface Library {
  id: string;
  name: string;
  oneshotsDirectory: string;
}

export interface Series {
  id: string;
  libraryId: string;
  name: string;
  booksCount: number;
  booksReadCount: number;
  booksUnreadCount: number;
  booksInProgressCount: number;
  metadata: {
    title: string;
    titleSort: string;
  };
  fileLastModified: string;
  oneshot: boolean;
}

export interface Book {
  id: string;
  seriesId: string;
  seriesTitle: string;
  libraryId: string;
  name: string;
  number: number;
  sizeBytes: number;
  fileHash: string;
  media: {
    status: string;
    mediaType: string;
    pagesCount: number;
  };
  metadata: {
    title: string;
    numberSort: number;
  };
  readProgress: {
    page: number;
    completed: boolean;
    readDate: string;
  } | null;
  oneshot: boolean;
}

export interface PageDto {
  number: number;
  fileName: string;
  mediaType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface PageResponse {
  content: any[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ServerCapabilities {
  name: string;
  version: string;
  apiBasePath: string;
  compatibility: string;
  corsConfigured: boolean;
  features: Record<string, boolean>;
}
