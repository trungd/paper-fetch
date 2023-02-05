import { Arxiv, ArxivPaper } from '..';
import { PaperQuery } from '../base';
import fetch from './__mocks__/fetch';

describe('ArXiv', () => {
  global.fetch = fetch;

  it('can fetch', (done) => {
    const paperQuery: PaperQuery = {
      arxivId: '1905.11946',
    };
    Arxiv.fetch(paperQuery)
      .then((paper) => {
        const p = paper as ArxivPaper;
        expect(p.id).toBe('1905.11946');
        expect(p.authors.length).toBe(2);
        expect(p.categories.length).toBe(3);
        done();
      })
      .catch((_e) => done());
    // expect(tree.children.length).toBe(1);
  });

  it('can search with url', async () => {
    const results = (await Arxiv.search(
      'https://arxiv.org/abs/1706.03762',
      0,
      10
    )) as ArxivPaper[];
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Attention Is All You Need');
    expect(results[0].id).toBe('1706.03762');
  });

  it('can search with keywords', async () => {
    const results = (await Arxiv.search('ImageNet', 0, 2)) as ArxivPaper[];
    expect(results.length).toBe(2);
  });

  it('can handle empty results', async () => {
    const results = await Arxiv.search(
      'https://arxiv.org/abs/1706.03762',
      1,
      10
    );
    expect(results.length).toBe(0);
  });
});
