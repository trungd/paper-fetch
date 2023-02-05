import { Arxiv, ArxivPaper } from '..';
import { PaperQuery } from '../base';

describe('IEEEXplore', () => {
  it('can fetch', async () => {
    // global.fetch = jest.fn(() =>
    //   Promise.resolve({
    //     json: () => Promise.resolve({}),
    //   } as Response)
    // );
    // const paperQuery: PaperQuery = {
    //   doi: '10.1109/76.564123',
    // };
    // Arxiv.fetch(paperQuery)
    //   .then((paper) => {
    //     const p = paper as ArxivPaper;
    //     expect(p.id).toBe('1905.11946');
    //     expect(p.authors.length).toBe(2);
    //     expect(p.categories.length).toBe(3);
    //     done();
    //   })
    //   .catch((e) => done(e));
    // // expect(tree.children.length).toBe(1);
  });
});
