import {PaperQuery, Source, SourcePaper} from './base';
import {comparePaperWithQuery} from './utils';

export type OpenReviewPaper = SourcePaper & {
  id: string;
  original: string;
  number: number;
  cdate: number;
  mdate: number;
  ddate: number;
  tcdate: number;
  tmdate: number;
  tddate: number;
  forum: string;
  replyto: string;
  invitation: string;
  content: {
    title: string;
    abstract: string;
    authorids: string[];
    authors: string[];
    keywords: string[];
    'TL;DR': string;
    submission_history: string;
    code_of_conduct: string;
    paperhash: string;
    pdf: string;
    supplementary_material: string;
    checklist: string;
    code: string;
    thumbnail: string;
    _bibtex: string;
    venue: string;
    venueid: string;
  };
  signatures: string[];
  readers: string[];
  nonreaders: string[];
  writers: string[];
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

export const OpenReview: Source = {
  source: 'OpenReview',
  canSearch: false,
  search: async (searchQuery: string, start = 0, maxResults = 10) => {
    const normalize = (t: string) => t.toLowerCase().replace(/\W/g, ' ');
    const res = await (
      await fetch(
          `https://api.openreview.net/notes/search?${new URLSearchParams({
            query: normalize(searchQuery),
            limit: maxResults.toString(),
            offset: start.toString(),
          }).toString()}`,
      )
    ).json();
    const items = res.notes as Record<string, string>[];
    return items.map((json) => {
      const data = json as unknown as OpenReviewPaper;
      return {
        ...data,
        title: data.content.title,
      } as OpenReviewPaper;
    });
  },
  fetch: async (paperQuery: PaperQuery) => {
    if (paperQuery.title && paperQuery.authors) {
      const res = await OpenReview.search(paperQuery.title, 0, 5);
      for (const p of res) {
        if (comparePaperWithQuery(p, paperQuery)) return p;
      }
      throw Error('Paper not found.');
    } else {
      throw Error(
          `Query ${JSON.stringify(paperQuery)} is invalid or not supported.`,
      );
    }
  },
};
