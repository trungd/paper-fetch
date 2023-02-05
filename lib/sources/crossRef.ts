import _, {isArray, isObject} from 'lodash';

import {PaperQuery, Source, SourcePaper} from './base';
import {comparePaperWithQuery, fetchWithTimeout} from './utils';

type JSONValue = string | number | boolean | null | JSONValue[] | JSONObject;

interface JSONObject {
  [k: string]: JSONValue;
}
// type JSONArray = Array<JSONValue>;

type Author = {
  ORCID?: string;
  suffix?: string;
  given?: string;
  family?: string;
  affliation?: { name?: string }[];
  name?: string;
  authenticatedOrcid?: boolean;
  prefix?: string;
  sequence?: string;
};

export type CrossRefPaper = SourcePaper & {
  containerTitle: string[];
  publisher: string;
  member: string;

  indexed: string;
  deposited: string;
  created: string;

  type: string;
  event?: {
    name?: string;
    location?: string;
    start?: number[];
    end?: number[];
  };
  institution?: {
    name: string;
    place: string[];
    department: string[];
    acronym: string[];
  };
  authors: Author[];
  link: {
    url: string;
  }[];
  url: string;
  language: string;
  subjects: string[];
};

const deepMapKeys = (obj: unknown): unknown => {
  if (!isObject(obj)) return obj;
  if (isArray(obj)) return (obj as unknown[]).map((d) => deepMapKeys(d));
  return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [
        _.camelCase(key),
        deepMapKeys(val),
      ]),
  );
};

type CrossRefPaperResponse = JSONObject & {
  event: JSONObject & {
    start?: JSONObject;
    end?: JSONObject;
  };
  author: JSONObject[];
  deposited: { dateTime: string };
  created: { dateTime: string };
  indexed: { dateTime: string };
  resource: {
    primary: {
      URL: string;
    };
  };
  link: { url: string }[];
};

const mapJSONtoObject = (data: CrossRefPaperResponse): CrossRefPaper =>
  ({
    title: data.title ? (data.title as JSONValue[])[0] : '',
    containerTitle: data.containerTitle,
    publisher: data.publisher,
    member: data.member,
    referenceCount: data.referenceCount,
    citationCount: data.isReferencedByCount,
    type: data.type,
    event: data.event ?
      {
        name: data.event.name,
        location: data.event.location,
        start: data.event.start && data.event.start.dataParts,
        end: data.event.end && data.event.end.dataParts,
      } :
      undefined,
    authors: data.author ?
      data.author.map((a) => ({
        given: a.given,
        family: a.family,
        sequence: a.sequence,
        affliation: a.affliation,
      })) :
      undefined,
    deposited: data.deposited.dateTime,
    created: data.created.dateTime,
    indexed: data.indexed.dateTime,
    link: [
      ...(data.link ? data.link.map((d) => ({url: d.url})) : []),
      ...(data.resource.primary.URL || []),
    ],
    url: data.url,
    language: data.language,
    subjects: data.subject,
    error: null,
  } as CrossRefPaper);

export const CrossRef: Source = {
  source: 'CrossRef',
  canSearch: false,
  search: async (searchQuery: string, start = 0, maxResults = 10) => {
    const res = await (
      await fetchWithTimeout(
          `https://api.crossref.org/works?${new URLSearchParams({
            query: searchQuery,
            offset: start.toString(),
            rows: maxResults.toString(),
          }).toString()}`,
      )
    ).json();
    if (res.status !== 'ok') throw Error('Failed to retrieved data.');
    const items = deepMapKeys(res.message.items) as Record<string, string>[];
    return items.map((data) => mapJSONtoObject(data as CrossRefPaperResponse));
  },
  fetch: async (paperQuery: PaperQuery) => {
    if (paperQuery.doi) {
      const res = await (
        await fetchWithTimeout(
            `https://api.crossref.org/works/${paperQuery.doi}`,
        )
      ).json();
      if (res.status !== 'ok') return null;
      const data = deepMapKeys(res.message) as JSONObject;
      return mapJSONtoObject(data as CrossRefPaperResponse);
    } else if (paperQuery.title && paperQuery.authors) {
      const res = await CrossRef.search(paperQuery.title, 0, 5);
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
