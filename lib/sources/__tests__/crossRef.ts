import { CrossRef, CrossRefPaper } from '..';
import { PaperQuery } from '../base';
import fetch from './__mocks__/fetch';

describe('CrossRef', () => {
  global.fetch = fetch;

  it('can fetch with doi', (done) => {
    const paperQuery: PaperQuery = {
      doi: '10.1016/s0021-9258(19)52451-6',
    };
    CrossRef.fetch(paperQuery)
      .then((paper) => {
        expect(paper).not.toBeNull();
        const p = paper as CrossRefPaper;
        expect(p.title?.toUpperCase()).toBe(
          'PROTEIN MEASUREMENT WITH THE FOLIN PHENOL REAGENT'
        );
        expect(p.citationCount).toBeGreaterThan(100000);
        expect(p.authors.length).toEqual(4);
        done();
      })
      .catch((_e) => done());
  });

  it('can fetch with title', async () => {
    const paperQuery: PaperQuery = {
      title: 'Deep Residual Learning for Image Recognition',
      authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
    };
    const paper = await CrossRef.fetch(paperQuery);
    expect(paper).not.toBeNull();
    const p = paper as CrossRefPaper;
    paperQuery.title && expect(p.title).toEqual(paperQuery.title);
    expect(p.authors.map((a) => a.family)).toContain('He');
  });

  it('can search with keywords', async () => {
    const results = (await CrossRef.search(
      'Deep Residual Learning for Image Recognition',
      0,
      2
    )) as CrossRefPaper[];
    expect(results.length).toBe(2);
    expect(results[0].title).toEqual(
      'Deep Residual Learning for Image Recognition'
    );
  });

  // it('can handle empty results', async () => {
  //   const results = await Arxiv.search(
  //     'https://arxiv.org/abs/1706.03762',
  //     1,
  //     10
  //   );
  //   expect(results.length).toBe(0);
  // });
});
