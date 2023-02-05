export type SourcePaper = {
  title?: string;
  authorNames?: string[];
  referenceCount?: number;
  citationCount?: number;
  error: string | null;
};

export type SourceAuthor = {
  name: string;
};

export type PaperQuery = {
  title?: string;
  authors?: string[];
  url?: string;
  arxivId?: string;
  semanticScholarId?: string;
  paperShelfId?: string;
  doi?: string;
};

export type SourceKey =
  'arxiv' | 'semanticScholar' | 'crossRef' | 'paperShelf' | 'openReview';
export type Source = {
  source: string;
  canSearch: boolean;
  search: (
    searchQuery: string,
    start: number,
    maxResults: number
  ) => Promise<SourcePaper[]>;
  searchAuthor?: (
    searchQuery: string,
    start: number,
    maxResults: number
  ) => Promise<SourceAuthor[]>;
  getReferencePapers?: (paperQuery: PaperQuery) => Promise<SourcePaper[]>;
  getCitationPapers?: (paperQuery: PaperQuery) => Promise<SourcePaper[]>;
  fetch: (paperQuery: PaperQuery) => Promise<SourcePaper | null>;
};
