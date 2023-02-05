import {PaperQuery, SourcePaper} from './base';

export const comparePapers = (
    p1: SourcePaper, p2: SourcePaper | PaperQuery): boolean => {
  if (
    p1.title?.replace(/\W/g, '').toLowerCase() !==
    p2.title?.replace(/\W/g, '').toLowerCase()
  ) {
    return false;
  }
  if (p1.authorNames?.length !== 
      ((p2 as PaperQuery).authors || (p2 as SourcePaper).authorNames)?.length) {
    return false;
  }
  return true;
};

export const comparePaperWithQuery = (
    p: SourcePaper,
    q: PaperQuery,
): boolean => {
  if (
    q.title &&
    p.title?.replace(/\W/g, '').toLowerCase() !==
      q.title.replace(/\W/g, '').toLowerCase()
  ) {
    return false;
  }
  return true;
};

export const fetchWithTimeout = async (
    input: RequestInfo,
    _timeout = 3000,
): Promise<Response> => {
  return Promise.race([
    fetch(input),
    // TODO: temporarily disable timeout since it causes issues with tests
    // new Promise((_, reject) =>
    //   setTimeout(() => reject(new Error('Timeout')), timeout),
    // ),
  ]).then();
};

/**
 * @param t1 - title 1
 * @param t2 - title 2
 * @returns - `true` if two papers are the same
 */
export function comparePaperTitle(t1: string, t2: string): boolean {
  const normalize = (t: string) => t.toLowerCase().replace(/\W/g, '');
  return normalize(t1) === normalize(t2);
}
