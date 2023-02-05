// @ts-nocheck
import { SemanticScholar, SemanticScholarPaper } from '..';
import { PaperQuery } from '../base';
import fetch from './__mocks__/fetch';

describe('Semantic Scholar', () => {
  global.fetch = fetch;
  it('can fetch', async () => {
    const p = await SemanticScholar.fetch(
      {arxivId: '1512.03385'} as PaperQuery
    ) as SemanticScholarPaper;
    expect(p.title).toEqual('Deep Residual Learning for Image Recognition');
    expect(p.authors.length).toEqual(4);
  });

  it('can fetch by title and authors', async () => {
    const p = await SemanticScholar.fetch({
      title: 'Human-level control through deep reinforcement learning',
      authors: ["Volodymyr Mnih", "K. Kavukcuoglu", "David Silver",
          "Andrei A. Rusu", "J. Veness", "Marc G. Bellemare", "A. Graves",
          "Martin A. Riedmiller", "A. Fidjeland", "Georg Ostrovski",
          "Stig Petersen", "Charlie Beattie", "A. Sadik", "Ioannis Antonoglou",
          "Helen King", "D. Kumaran", "Daan Wierstra", "S. Legg",
          "D. Hassabis"],
    } as PaperQuery) as SemanticScholarPaper;
    expect(p.title).toEqual(
        'Human-level control through deep reinforcement learning');
    expect(p.authors.length).toEqual(19);
  });

  it('can search', async () => {
    const papers = await SemanticScholar.search('imagenet', 0, 10)
    expect(papers.length).toBe(10)
  })
});