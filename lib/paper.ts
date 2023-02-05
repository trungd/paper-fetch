import _ from 'lodash';
import {
  ArxivPaper,
  CrossRefPaper,
  getArxivIdFromUrl,
  OpenReviewPaper,
  PaperShelfPaper,
  SemanticScholar,
  SemanticScholarPaper,
  Sources,
} from './sources';
import {PaperQuery, SourceKey, SourcePaper} from './sources/base';

/**
 * replace any sequence of whitespace with a single space
 * @param title - title
 * @returns normalized title
 */
export function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, ' ');
}

export type Author = {
  fullName: string;
};

/**
 * Paper type
 */
export type Paper = {
  ids: {
    semanticScholar?: string;
    paperShelf?: string;
    doi?: string;
    arxiv?: string;
    dblp?: string;
    mag?: string;
  };
  title?: string;
  alias?: string;
  year?: string;
  venue?: string;
  venueShort?: string;
  numCitations?: number;
  numReferences?: number;
  /**
   * a short abbreviation of the paper
   * (e.g. name of the main proposed method)
  */
  pdfUrl?: string;
  htmlUrl?: string;
  abstract?: string;
  /** a paper summary in few sentences */
  tldr?: string;

  authors: Author[];

  affiliations: string[];
  keywords?: string[];

  autoTags: string[];

  /** a record of results retured by each metadata source */
  sources: Record<SourceKey, SourcePaper>;
  dateFetched: Record<string, number>;

  urls: {
    type: 'pdf' | 'html' | 'code' | 'slides' | 'web' | 'video' | 'other';
    url: string;
    desc: string;
  }[];
}

/**
 * Create a new paper with default fields
 * @param id - paper id
 * Paper object with default values
 */
export function createEmptyPaper(): Paper {
  return {
    authors: [],
    affiliations: [],
    autoTags: [],
    ids: {},
    urls: [],
    sources: {} as Record<SourceKey, SourcePaper>,
    dateFetched: {},
  } as Paper;
}

/**
 * Refresh urls.
 */
function _refreshUrls(p: Paper): Paper {
  let urls = p.urls.filter((u) => u.url);
  urls = urls.filter(({url}, index, self) =>
    index === self.findIndex((t) => t.url === url));
  return {...p, urls};
}

/**
 * Called after changing paper's fields to clean if necessary and
 * update other dependent fields.
 */
export function refreshPaper(p: Paper): Paper {
  let paper: Paper = {
    ...p,
    pdfUrl: p.pdfUrl?.replace('http:', 'https:'),
    dateFetched: typeof p.dateFetched === 'object' ? p.dateFetched : {},
  };
  paper = _refreshUrls(paper);
  return paper;
}

/**
 * Add tags
 * @param currentTags - list of current tags
 * @param newTags - list of tag names
 */
export function appendTags(currentTags: string[], newTags: string[]): string[] {
  const tagNames = newTags.map((tag) =>
    tag
        .toLowerCase()
        .replace(/[ .]/g, '-')
        .replace(/[^a-z0-9\-:]/g, ''),
  );
  return [...new Set([...currentTags, ...tagNames])];
}

/**
 * Remove a tag
 * @param tag - a tag name
 */
export function removeTag(tags: string[], tag: string): string[] {
  return tags.filter((t) => t !== tag);
}

/**
 * @param sp - arxiv paper
 */
function _populateFromArxiv(p: Paper, sp: ArxivPaper): Paper {
  p.pdfUrl = sp.pdfUrl;
  p.title = normalizeTitle(sp.title || '');
  p.abstract = p.abstract || sp.abstract;
  p.year = p.year || sp.updated.getFullYear().toString();
  p.authors = sp.authors.map((name) => ({
    fullName: name,
  }));
  p.autoTags = appendTags(p.autoTags, sp.categories.map((t) => `arXiv:${t}`));
  p.urls.push({
    type: 'pdf',
    url: sp.pdfUrl,
    desc: 'ArXiv',
  });
  p.htmlUrl = sp.htmlUrl;
  p.urls.push({
    type: 'html',
    url: p.htmlUrl,
    desc: 'Ar5iv',
  });
  p.ids = {
    ...p.ids,
    arxiv: sp.id,
  };
  return p;
}

/**
 * @param sp - semantic paper
 */
function _populateFromSemanticScholar(
    p: Paper, sp: SemanticScholarPaper,
): Paper {
  if (!sp.paperId) return p;

  p.title = p.title || sp.title;
  p.abstract = p.abstract || sp.abstract;
  p.tldr = p.tldr || sp.tldr?.text;
  p.pdfUrl = p.pdfUrl || sp.openAccessPdf?.url;

  if (p.authors.length === 0) {
    p.authors = sp.authors.map((a) => ({
      fullName: a.name,
    })) || [];
  }

  p.affiliations = [
    ...new Set(
        sp.authors
            .map((a) => a.affiliations)
            .filter((a) => !!a)
            .flat(),
    ),
  ];
  p.autoTags = appendTags(p.autoTags, [
    ...p.affiliations.map((a) => 'affiliated:' + a),
    ...(sp.s2FieldsOfStudy?.map((f) => `ss:${f.category}`) || []),
    ...(sp.fieldsOfStudy?.map((f) => `ss:${f}`) || []),
  ]);

  p.numCitations = sp.citationCount;
  p.numReferences = sp.referenceCount;
  p.year = p.year || sp.year.toString();
  p.venue = sp.venue;
  if (sp.topics) {
    p.autoTags = appendTags(
        p.autoTags, sp.topics.map((t) => `ss:${t.topic}`));
  }
  if (sp.venue.toLowerCase() === 'arxiv') {
    p.autoTags = appendTags(p.autoTags, ['auto:preprint']);
  }
  p.ids = {
    ...p.ids,
    semanticScholar: sp.paperId,
    arxiv: p.ids.arxiv || sp.externalIds.ArXiv,
    doi: p.ids.doi || sp.externalIds.DOI,
    mag: p.ids.mag || sp.externalIds.MAG,
    dblp: p.ids.dblp || sp.externalIds.DBLP,
  };
  p.urls = [
    ...p.urls,
    {
      type: 'web',
      url: sp.url,
      desc: 'Semantic Scholar',
    },
  ];
  return p;
}

/**
 * @param sp - crossref paper
 */
function _populateFromCrossRef(p: Paper, sp: CrossRefPaper): Paper {
  if (sp.url) {
    p.urls.push({
      type: 'other',
      url: sp.url,
      desc: 'CrossRef',
    });
  }
  p.venue = p.venue || sp.event?.name;
  return p;
}

/**
 * @param sp - paper shelf paper
 */
function _populateFromPaperShelf(p: Paper, sp: PaperShelfPaper): Paper {
  p.ids = {...p.ids, paperShelf: sp.id};
  p.title = p.title || sp.title;
  p.alias = sp.alias;
  p.authors = p.authors.length === 0 ?
    sp.authors : sp.authors;
  p.tldr = p.tldr || sp.tldr;
  p.numCitations = p.numCitations || sp.numCitations;
  p.numReferences = p.numReferences || sp.numReferences;
  p.venue = p.venue || sp.venue;
  p.year = p.year || sp.year;
  p.abstract = p.abstract || sp.abstract;
  p.autoTags = appendTags(p.autoTags, sp.autoTags);
  return p;
}

/**
 * @param sp - open review paper
 */
function _populateFromOpenReview(p: Paper, sp: OpenReviewPaper): Paper {
  if (!sp.content) return p;
  p.title = p.title || sp.title;
  p.tldr = p.tldr || sp.content['TL;DR'];
  p.abstract = p.abstract || sp.content.abstract;

  if (sp.content.code) {
    p.urls.push({
      type: 'code',
      url: sp.content.code,
      desc: 'OpenReview (Code)',
    });
  }

  if (sp.forum) {
    p.urls.push({
      type: 'web',
      url: `https://openreview.net/forum?id=${sp.forum}`,
      desc: 'OpenReview (Forum)',
    });
  }
  p.venue = p.venue || sp.content.venue;

  const pdfUrl = (
    (sp.content.pdf.startsWith('/') ? 'https://openreview.net' : '') +
      sp.content.pdf);
  if (pdfUrl) {
    p.pdfUrl = p.pdfUrl || pdfUrl;
    p.urls.push({
      type: 'pdf',
      url: pdfUrl,
      desc: 'OpenReview (PDF)',
    });
  }

  if (sp.content.keywords) {
    p.autoTags = appendTags(p.autoTags, sp.content.keywords.map(
        (kw) => `openreview:${kw}`));
  }
  return p;
}

/**
 * @returns updated paper
 */
export function populateFieldsFromSources(paper: Paper): Paper {
  let p: Paper = {
    ...paper,
    autoTags: paper.autoTags.filter((t) => !t.includes(':')),
    urls: [],
  };

  for (const [source, sp] of
    (Object.entries(p.sources) as Array<[SourceKey, SourcePaper]>)) {
    if (!sp) continue;
    if (sp.error) continue;
    p.autoTags = appendTags(p.autoTags, [`auto:${source}`]);
    switch (source) {
      case 'arxiv': {
        p = _populateFromArxiv(p, sp as ArxivPaper);
        break;
      }
      case 'semanticScholar': {
        p = _populateFromSemanticScholar(p,
                    sp as SemanticScholarPaper);
        break;
      }
      case 'crossRef': {
        p = _populateFromCrossRef(p, sp as CrossRefPaper);
        break;
      }
      case 'paperShelf': {
        p = _populateFromPaperShelf(p, sp as PaperShelfPaper);
        break;
      }
      // case GoogleScholar.source: {
      //   const p = paper as GoogleScholarPaper;
      //   this.title = this.title || p.title;
      //   this.abstract = this.abstract || p.abstract;
      //   if (this.authors.length === 0)
      //     this.authors = googlePaper.authors.map((a) => a.name);
      //   this.numCitations = this.numCitations || p.numCitations;

      //   if (googlePaper.venue)
      //     this.appendTags([`venue:${googlePaper.venue}`]);
      //   if (googlePaper.year) this.appendTags([`year:${p.year}`]);
      //   break;
      // }
      case 'openReview': {
        p = _populateFromOpenReview(p, sp as OpenReviewPaper);
        break;
      }
      default: {
        break;
      }
    }
  }

  return refreshPaper(p);
}

/**
 * Convert key-value pairs to Paper object
 * @param papers - list of papers of key-value pairs
 * @returns list of papers
 */
export function getPapersFromObject(papers: Record<string, unknown>): Paper[] {
  return Object.entries(papers).map(
      ([key, paper]) =>
        ({
          ...(paper as Paper),
          id: key,
        }),
  );

  /*
  try {
    const fileContents = fs.readFileSync(
      `${store.get('dataLocation')}/papers.yml`,
      'utf8'
    );
    const data = yaml.load(fileContents);
    return Object.entries(data!.papers as Paper[]).map(([key, paper]) => ({
      ...paper,
      id: key,
    }));
  } catch (e) {
    console.log(e);
    return [];
  }
  */
}

/**
 * get paper query from paper
 * @param p - paper
 * @returns paper query
 */
export function getPaperQuery(p: Paper): PaperQuery {
  return {
    arxivId:
        p?.ids.arxiv ||
        (p?.pdfUrl ? getArxivIdFromUrl(p?.pdfUrl) || undefined : undefined),
    semanticScholarId: p?.ids.semanticScholar,
    paperShelfId: p?.ids.paperShelf,
    doi: p?.ids.doi,
    title: p.title,
    authors: p.authors.map((a) => a.fullName),
  };
}

/**
 * Sort source names
 * @param paperQuery - paper query
 * @param sources - list of source names
 * @returns sorted list of source names
 */
function _sortFetchPaperSources(
    paperQuery: PaperQuery, sources: SourceKey[]): SourceKey[] {
  const weights = Object.fromEntries(
      sources.map(name => [name, 0])) as Record<SourceKey, number>;
  if (paperQuery.arxivId) weights.arxiv += 1;
  if (paperQuery.semanticScholarId) weights.semanticScholar += 2;
  return sources.sort((a, b) => weights[b] - weights[a]);
}

/**
 * Fetch paper details from different sources
 * @param paper - a paper
 * @param fetchPaperSources - list of source names
 */
export async function fetchPaper(
    paperQuery: PaperQuery,
    fetchPaperSources: SourceKey[],
    updateProgressFn?: (paper: Paper, msg: string) => void,
): Promise<Paper> {
  let p: Paper = _.merge(createEmptyPaper(), {
    id: paperQuery.paperShelfId,
    title: paperQuery.title,
    authors: paperQuery.authors?.map((a) => ({fullName: a})) || [],
    ids: {
      arxiv: paperQuery.arxivId,
      semanticScholar: paperQuery.semanticScholarId,
      paperShelf: paperQuery.paperShelfId,
    },
  });
  let pq = paperQuery;
  const sources = _sortFetchPaperSources(paperQuery, fetchPaperSources);

  for (const sourceKey of sources) {
    const src = Sources.find((s) => s.key === sourceKey);
    if (!src) continue;
    updateProgressFn && updateProgressFn(p, `Loading from ${src.name}...`);
    try {
      pq = _.merge(paperQuery, getPaperQuery(p))
      const sp = await src.cls.fetch(pq);
      if (sp) {
        p = populateFieldsFromSources({
          ...p,
          sources: {...p.sources, [sourceKey]: sp},
          dateFetched: {...p.dateFetched, [sourceKey]: Date.now()},
        });
      }
    } catch (e) {
      p = {
        ...p,
        sources: {
          ...p.sources,
          [sourceKey]: {error: (e as Error).message || (e as string)},
        },
        dateFetched: {...p.dateFetched, [sourceKey]: Date.now()},
      };
    }
  }
  return p;
}

/**
 * search for papers
 * @param query - a string query
 * @param searchPaperSources - list of source names
 * @param callback - callback function called after each source finished
 * @param offset - offset value
 * @param limit - limit value
 * @returns list of papers
 */
export async function searchPaper(
    query: string,
    searchPaperSources: SourceKey[],
    callback?: (p: Paper[], source: string) => void,
    offset = 0,
    limit = 10,
): Promise<Paper[]> {
  let sources = searchPaperSources;
  try {
    const searchResults = await Promise.all(
        Sources.map(async (src) => {
          if (!sources.includes(src.key)) return [];
          try {
            const srcPapers = await src.cls.search(query, offset * 10, limit);
            const papers = srcPapers.map((sp: SourcePaper) =>
              populateFieldsFromSources({
                ...createEmptyPaper(),
                sources: {[src.key]: sp},
              } as Paper),
            );
            sources = sources.filter((s) => s !== src.key);
            callback && callback(papers, src.key);
            return papers;
          } catch (e) {
            console.log(e);
            callback && callback([], src.key);
            return [];
          }
        }),
    );
    // Assign ids and remove papers that do not have an id (empty)
    return searchResults.flat();
  } catch (err) {
    return [];
  }
}

/**
 * Merge two papers
 * @param p1 - paper 1
 * @param p2 - paper 2
 * @returns - merged paper
 */
export function mergePaper(p1: Paper | null, p2: Paper | null): Paper {
  return {
    ...createEmptyPaper(),
    ...p1 || {},
    ...p2 || {},
    sources: {
      ...p1?.sources,
      ...p2?.sources,
    },
  } as Paper;
}

/**
 * get reference papers
 * @param p - paper
 */
export async function getReferencePapers(p: Paper): Promise<Paper[]> {
  const paperQuery = getPaperQuery(p);
  if (!SemanticScholar.getReferencePapers) return [];
  return Promise.all((await SemanticScholar.getReferencePapers(paperQuery))
      .map(async (sp) => {
        const p = populateFieldsFromSources({
          ...createEmptyPaper(),
          sources: {'semanticScholar': sp},
        } as Paper);
        return p;
      }));
}

/**
 * get citation papers
 * @param p - paper
 */
export async function getCitationPapers(p: Paper): Promise<Paper[]> {
  const paperQuery = getPaperQuery(p);
  if (!SemanticScholar.getCitationPapers) return [];
  return Promise.all((await SemanticScholar.getCitationPapers(paperQuery))
      .map(async (sp) => {
        const p = populateFieldsFromSources({
          ...createEmptyPaper(),
          sources: {'semanticScholar': sp},
        } as Paper);
        return p;
      }));
}

export default Paper;
