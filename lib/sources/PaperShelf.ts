import {Author} from '../paper';
import {PaperQuery, Source, SourcePaper} from './base';


export type PaperShelfPaper = SourcePaper & {
  id: string;
  alias: string;
  tldr: string;
  title: string;
  authors: Author[];
  year: string;
  venue: string;
  numCitations: number;
  numReferences: number;
  autoTags: string[];
  abstract: string;
};

export const PaperShelf: Source = {
  source: 'PaperShelf',
  canSearch: false,
  search: async () => [],
  fetch: async (paperQuery: PaperQuery) => {
    if (!paperQuery.paperShelfId) throw Error('Paper not found.');
    const response = await fetch(
        'https://papershelf-node.azurewebsites.net/api/GetPublicPaper?id=' +
        paperQuery.paperShelfId);
    if (response.status === 404) throw Error('Paper not found.');
    return ({
      ...(await response.json()),
      id: paperQuery.paperShelfId,
    }) as PaperShelfPaper;
  },
};
