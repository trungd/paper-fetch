import {XMLParser} from 'fast-xml-parser';

import {PaperQuery, Source, SourcePaper} from './base';
import {comparePaperTitle} from './utils';

export type ArxivPaper = SourcePaper & {
  id: string;
  url: string;
  pdfUrl: string;
  htmlUrl: string;
  journalRef: string;
  updated: Date;
  published: Date;
  abstract: string;
  authors: string[];
  categories: string[];
  comment: string;
};

// const getCategoryName = (id: string) => {
//   const res = (
//     categories as {
//       id: string;
//       name: string;
//     }[]
//   ).filter((c) => c.id === id);
//   if (res.length === 1) {
//     return res[0].name.replaceAll(' ', '-').toLowerCase();
//   }
//   return id;
// };

/**
 * @param url - url string
 * @returns arxiv id from the url
 */
export function getArxivIdFromUrl(url: string): string | null {
  const pattern =
    // eslint-disable-next-line max-len
    /^https?:\/\/arxiv.org\/(?:abs\/([0-9]+\.[0-9]+)(?:v[0-9]+)?|pdf\/([0-9]+\.[0-9]+)(?:v[0-9]+)?\.pdf)$/;
  if (pattern.test(url)) {
    const matches = url.match(pattern);
    return matches ? matches[1] || matches[2] : null;
  }
  return null;
}

export const Arxiv: Source = {
  source: 'arXiv',
  canSearch: true,
  search: async (searchQuery: string, start = 0, maxResults = 10) => {
    const arxivId =
      getArxivIdFromUrl(searchQuery) ||
      (searchQuery.startsWith('arxiv:') ?
        searchQuery.replace('arxiv:', '') :
        null);

    const normalize = (t: string) => t.toLowerCase().replace(/\W/g, ' ');
    const getPdfUrl = (id: string) => `${id.replace('abs', 'pdf')}.pdf`;

    const response = await fetch(
        `https://export.arxiv.org/api/query?${new URLSearchParams({
          ...(arxivId ?
          {id_list: arxivId} :
          {search_query: normalize(searchQuery)}),
          start: start.toString(),
          max_results: maxResults.toString(),
          sortBy: 'relevance',
        }).toString()}`,
    );
    const rawXmlContent = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
    });
    const data = parser.parse(rawXmlContent);
    const entries = data.feed.entry ?
        Array.isArray(data.feed.entry) ?
          data.feed.entry :
          [data.feed.entry] :
        [];
    return entries.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: Record<string, any>) =>
          ({
            id: getArxivIdFromUrl(e.id),
            pdfUrl: getPdfUrl(e.id),
            htmlUrl: e.id.replace('arxiv', 'ar5iv'),
            title: e.title,
            abstract: e.summary.trim().split('\n').join(' '),
            comment:
                'arxiv:comment' in e ? e['arxiv:comment']['#text'] : undefined,
            journalRef: 'arxiv:journal_ref' in e ?
                e['arxiv:journal_ref']['#text'] : undefined,
            updated: new Date(e.updated),
            published: new Date(e.published),
            authors: (Array.isArray(e.author) ? e.author : [e.author]).map(
                (author) => author.name,
            ),
            categories: (Array.isArray(e.category) ?
                e.category : [e.category]).map((cat) => {
              return cat['@_term'];
            }),
          } as ArxivPaper),
    );
  },
  fetch: async (paperQuery: PaperQuery) => {
    if (paperQuery.url) {
      const arxivId = getArxivIdFromUrl(paperQuery.url) || undefined;
      return Arxiv.fetch({arxivId});
    } else if (paperQuery.arxivId) {
      const res = await Arxiv.search('arxiv:' + paperQuery.arxivId, 0, 10);
      if (res.length === 1) {
        const arxivPaper = res[0];
        return arxivPaper;
      }
    } else if (paperQuery.title) {
      const res = await Arxiv.search(paperQuery.title, 0, 10);
      for (const arxivPaper of res) {
        if (comparePaperTitle(paperQuery.title || '', arxivPaper.title || '')) {
          return arxivPaper;
        }
      }
    }
    throw Error('Paper not found.');
  },
};

export const getPdfUrlFromArxivId = (id: string): string => {
  return `https://arxiv.org/pdf/${id}.pdf`;
};
