import { Arxiv, ArxivPaper } from '..';
import { PaperQuery } from '../base';
import { OpenReview, OpenReviewPaper } from '../openReview';
import fetch from './__mocks__/fetch';

describe('OpenReview', () => {
  global.fetch = fetch;

  it('can fetch', (done) => {
    const paperQuery: PaperQuery = {
      title: 'Diffusion Models Beat GANs on Image Synthesis',
      authors: ["Prafulla Dhariwal","Alexander Quinn Nichol"]
    };
    OpenReview.fetch(paperQuery)
      .then((paper) => {
        const p = paper as OpenReviewPaper;
        done();
      })
      .catch((_e) => done());
    // expect(tree.children.length).toBe(1);
  });

  it('can search', (done) => {
    OpenReview.search('Diffusion Models Beat GANs on Image Synthesis', 0, 5)
      .then((res) => {
        expect(res.length).toBe(5);
        done()
      });
  });
});
