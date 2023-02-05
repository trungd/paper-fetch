import {PaperQuery, Source, SourcePaper} from './base';

export type IEEEXplorePaper = SourcePaper & {
  paperId: string;
};

export const IEEEXplore: Source = {
  source: 'IEEE Xplore',
  canSearch: false,
  fetch: async (paperQuery: PaperQuery) => {
    if (paperQuery.doi) {
      const response = await fetch(
          `https://ieeexploreapi.ieee.org/api/v1/search/articles?doi=${paperQuery.doi}&apikey=s8bf2vmf349rf3bnnx5ahs35`,
      );
      const data = await response.json();

      return {
        ...data,
        numCitations: data.citations?.length,
        authors: await Promise.all(
            data.authors?.map(async ({authorId}: { authorId: string }) => {
              const response = await fetch(
                  `https://api.semanticscholar.org/graph/v1/author/${authorId}?fields=affiliations,authorId,name,url`,
              );
              return await response.json();
            }),
        ),
      } as IEEEXplorePaper;
    }

    return null;
  },
  search: async (_searchQuery: string, _start: number, _maxResults: number) => {
    return [];
  },
};
