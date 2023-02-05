import Paper, { fetchPaper, getReferencePapers, normalizeTitle, searchPaper } from '../paper';
import { ArxivPaper, SemanticScholarPaper, SourceKey, getPaperQuery } from '..';
import fetch from '../sources/__tests__/__mocks__/fetch';
import { PaperQuery } from '../sources';

describe('paper', () => {
  global.fetch = fetch;

  test('normalizing paper title', () => {
    expect(normalizeTitle('A title')).toBe('A title');
    expect(normalizeTitle('A \t\ntitle')).toBe('A title');
    expect(normalizeTitle('A \ntit\nle')).toBe('A tit le');
  })

  it('can search with url', async () => {
    await searchPaper(
      'https://arxiv.org/abs/1706.03762',
      ['arxiv'],
      (res) => {
        expect(res.length).toBe(1);
      },
      0
    );
  });

  it('can search', async () => {
    const papers = await searchPaper(
      'imagenet',
      ['arxiv', 'semanticScholar'],
      async (res, source) => {
        expect(res.length).toBe(10);
        const p = await fetchPaper(
            getPaperQuery(res[0]), ['arxiv', 'semanticScholar']);
        expect(p.sources.arxiv.title);
        expect(p.sources.semanticScholar.title);
        expect((p.sources.arxiv as ArxivPaper).id).toBe(
          (p.sources.semanticScholar as SemanticScholarPaper).externalIds.ArXiv
        );
        expect(
          (p.sources.semanticScholar as SemanticScholarPaper).authors.length
        ).toBe((p.sources.arxiv as ArxivPaper).authors.length);
      }
    );
    expect(papers.length).toBe(20);
  });

  it('can fetch', async () => {
    const papers = (
      await searchPaper(
        'https://arxiv.org/abs/1512.03385', ['arxiv'], undefined, 0, 1)
    ).flat(1); // "Deep Residual Learning for Image Recognition"
    expect(papers.length).toEqual(1);

    let p = papers[0];
    expect(p).not.toBeNull();
    expect(p.title).not.toBeNull();

    const sources: SourceKey[] = ['arxiv', 'semanticScholar', 'crossRef'];
    p = await fetchPaper(getPaperQuery(p), sources);
    for (const s of sources) {
      expect(!!p.sources[s]);
      expect(!p.sources[s].error);
    }

    expect(!!p.ids.arxiv);
    expect(p.authors.length).toBe(4);
    expect(p.autoTags.length).toBeGreaterThan(0);
    expect(!!p.pdfUrl);
    expect(p.year).toEqual('2015');
    expect(!!p.venue);
    // expect(p.authorShort).toEqual('He et al.');
    expect(p.numCitations).toBeGreaterThan(100000);
  });

  it('can fetch with semanticScholarId', async () => {
    const paperQuery: PaperQuery = {
      semanticScholarId: '2c03df8b48bf3fa39054345bafabfeff15bfd11d'
    }

    const sources: SourceKey[] = [
      'arxiv', 'semanticScholar', 'crossRef', 'openReview'];
    const p = await fetchPaper(paperQuery, sources);
    for (const s of sources) {
      expect(!!p.sources[s]);
      expect(!p.sources[s].error);
    }
    console.log(p)
    expect(p.sources.arxiv).not.toBeUndefined();
    expect(p.sources.semanticScholar).not.toBeUndefined();
    expect(p.sources.crossRef).not.toBeUndefined();
    expect(p.sources.openReview).not.toBeUndefined();

    expect(!!p.ids.arxiv);
    expect(p.authors.length).toBe(4);
    expect(p.autoTags.length).toBeGreaterThan(0);
    expect(!!p.pdfUrl);
    expect(p.year).toEqual('2015');
    expect(!!p.venue);
    // expect(p.authorShort).toEqual('He et al.');
    expect(p.numCitations).toBeGreaterThan(100000);
  });

  it('can get references', async () => {
    const papers = (
      await searchPaper(
        'https://arxiv.org/abs/1512.03385', ['arxiv'], undefined, 0, 1)
    ).flat(1); // "Deep Residual Learning for Image Recognition"
    expect(papers.length).toEqual(1);

    let p = papers[0];
    const ps = await getReferencePapers(p)
  })
});


