import {PaperQuery, Source, SourcePaper} from './base';
import { comparePapers } from './utils';

type Paper = {
  title: string;
  paperId: string;
  authors: {
    authorId: string;
    name: string;
  }[];
};

export type SemanticScholarPaper = SourcePaper & {
  paperId: string;
  arxivId: string;
  externalIds: {
    MAG: string;
    DOI: string;
    ArXiv: string;
    DBLP: string;
    CorpusId: string;
    PubMed: string;
  };
  title: string;
  url: string;
  venue: string;
  publicationVenue: {
    id: string,
    name: string,
    type: string,
    alternate_names: string[],
    url: string,
  };
  year: string;
  abstract: string;
  authors: {
    authorId: string;
    name: string;
    url: string;
    affiliations: string[];
  }[];
  topics: { topic: string; topicId: string; url: string }[];
  isOpenAccess: boolean;
  openAccessPdf: {
    url: string;
    status: string;
  };
  s2FieldsOfStudy: {
    category: string;
    source: string;
  }[]
  isPublisherLicensed: boolean;
  corpusId: number;
  fieldsOfStudy: string[];
  influentialCitationCount: number;
  referenceCount: number;
  citationCount: number;
  citations: Paper[];
  references: Paper[];
  tldr?: {
    model: string;
    text: string;
  },
  publicationDate: string;
  publicationTypes: ('JournalArticle' | 'Conference')[]
  citationStyles: Record<string, string>;
  journal: {
    pages: string;
  }
};

const getAuthors = async (
    authors: {
    authorId: string;
    name: string;
  }[],
) =>
  await Promise.all(
      authors?.map(async (a) => {
        if (a.authorId === null) {
          return {
            authorId: a.authorId,
            name: a.name,
          };
        }
        try {
          const response = await fetch(
              `https://api.semanticscholar.org/graph/v1/author/${a.authorId}?fields=affiliations,authorId,name,url`,
          );
          return await response.json();
        } catch (e) {
          return a;
        }
      }),
  );

/**
 * get semantic scholar paper's identifier
 * @param paperQuery - PaperQuery
 */
function getIdentifier(paperQuery: PaperQuery) {
  if (paperQuery.arxivId) return `arxiv:${paperQuery.arxivId}`;
  else if (paperQuery.semanticScholarId) return paperQuery.semanticScholarId;
  return null;
}

export const SemanticScholar: Source = {
  source: 'Semantic Scholar',
  canSearch: true,
  fetch: async (paperQuery: PaperQuery) => {
    const id = getIdentifier(paperQuery);
    const fields = ['paperId', 'externalIds', 'url', 'title', 'abstract',
        'venue', 'year', 'referenceCount', 'citationCount', 
        'influentialCitationCount', 'isOpenAccess', 'fieldsOfStudy',
        's2FieldsOfStudy', 'openAccessPdf', 'authors', 'tldr'].join(',');
    const endpoint = 'https://api.semanticscholar.org/graph/v1/paper'
    console.log(id, paperQuery)
    if (id) {
      const response = await fetch(
          `${endpoint}/${id}?fields=${fields}`,
      );
      if (response.status !== 200) {
        throw Error(`Status code: ${response.status}`);
      }
      const data = await response.json();
      return {
        ...data,
        authors: data.authors,
      } as SemanticScholarPaper;
    } else if (!!paperQuery.title && !!paperQuery.authors) {
      const fields = ['paperId', 'externalIds', 'url', 'title', 'abstract',
        'venue', 'year', 'referenceCount', 'citationCount', 
        'influentialCitationCount', 'isOpenAccess', 'fieldsOfStudy',
        's2FieldsOfStudy', 'openAccessPdf', 'authors'].join(',');
      const response = await fetch(
          `${endpoint}/search?query=${paperQuery.title}&fields=${fields}`);
      if (response.status !== 200) {
        throw Error(`Status code: ${response.status}`);
      }
      const data = await response.json();
      for (const p of data.data) {
        const ssPaper = {
          title: p.title,
          authorNames: p.authors.map((a: {name: string}) => a.name)
        } as SourcePaper
        if (comparePapers(ssPaper, paperQuery)) {
          return {
            ...p,
            authors: p.authors,
          } as SemanticScholarPaper;
        }
      }
    }
    throw Error('Paper not found.');
  },
  search: async (searchQuery: string, offset: number, limit: number) => {
    const endpoint = 'https://api.semanticscholar.org/graph/v1/paper/search';
    const normalize = (t: string) => t.toLowerCase().replace(/\W/g, ' ');
    const urlSearchParams = new URLSearchParams({
      query: normalize(searchQuery),
      offset: offset.toString(),
      limit: limit.toString(),
      fields: 'externalIds,url,title,venue,year,citationCount,authors,abstract',
    }).toString();
    const response = await (
      await fetch(`${endpoint}?${urlSearchParams}`)
    ).json();
    const papers = await Promise.all(
        response.data.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (d: any) =>
              ({
                title: d.title,
                paperId: d.paperId,
                externalIds: d.externalIds,
                url: d.url,
                venue: d.venue,
                year: d.year,
                citationCount: d.citationCount,
                authors: d.authors,
                abstract: d.abstract,
              } as SemanticScholarPaper),
        ),
    );
    return papers;
  },
  getReferencePapers: async (paperQuery: PaperQuery):
    Promise<SemanticScholarPaper[]> => {
    const id = getIdentifier(paperQuery);
    if (id) {
      const response = await fetch(
          `https://api.semanticscholar.org/graph/v1/paper/${id}?fields=` +
          (['title', 'authors', 'venue', 'year', 'externalIds', 'citationCount']
              .map((f) => `references.${f}`)).join(','),
      );
      if (response.status !== 200) {
        throw Error(`Status code: ${response.status}`);
      }
      const data = await response.json();
      const sps = await Promise.all(data.references.map(
          async (it: unknown) => ({
            ...it as SemanticScholarPaper,
          }) as SemanticScholarPaper));
      return sps.filter((sp) => !!sp.title && !!sp.authors.length);
    }
    throw Error('Paper cannot be identified.');
  },
  getCitationPapers: async (paperQuery: PaperQuery):
    Promise<SemanticScholarPaper[]> => {
    const id = getIdentifier(paperQuery);
    if (id) {
      const response = await fetch(
          `https://api.semanticscholar.org/graph/v1/paper/${id}?fields=` +
          (['title', 'authors', 'venue', 'year', 'externalIds', 'citationCount']
              .map((f) => `citations.${f}`)).join(','),
      );
      if (response.status !== 200) {
        throw Error(`Status code: ${response.status}`);
      }
      const data = await response.json();
      const sps = await Promise.all(data.citations.map(async (it: unknown) => ({
        ...it as SemanticScholarPaper,
      }) as SemanticScholarPaper));
      return sps.filter((sp) => !!sp.title && !!sp.authors.length);
    }
    throw Error('Paper cannot be identified.');
  },
};
