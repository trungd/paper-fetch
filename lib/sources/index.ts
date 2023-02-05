import {Arxiv} from './arxiv';
import {Source, SourceKey} from './base';
import {CrossRef} from './crossRef';
import {OpenReview} from './openReview';
import {PaperShelf} from './PaperShelf';
import {SemanticScholar} from './semanticScholar';

export * from './arxiv';
export * from './base';
export * from './crossRef';
export * from './openReview';
export * from './PaperShelf';
export * from './semanticScholar';

type SourceProps = {
  key: SourceKey;
  name: string;
  cls: Source;
  url: string;
  canFetch: boolean;
  canSearch: boolean;
  deselectable: boolean;
};

export const Sources: SourceProps[] = [
  {
    key: 'paperShelf',
    name: 'PaperShelf',
    url: 'https://papershelf.app',
    cls: PaperShelf,
    canFetch: true,
    canSearch: false,
    deselectable: false,
  },
  {
    key: 'arxiv',
    name: 'arXiv',
    url: 'https://arxiv.org',
    cls: Arxiv,
    canFetch: true,
    canSearch: true,
    deselectable: false,
  },
  {
    key: 'semanticScholar',
    name: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org',
    cls: SemanticScholar,
    canFetch: true,
    canSearch: true,
    deselectable: true,
  },
  {
    key: 'crossRef',
    name: 'CrossRef',
    url: 'https://www.crossref.org',
    cls: CrossRef,
    canFetch: true,
    canSearch: false,
    deselectable: true,
  },
  {
    key: 'openReview',
    name: 'OpenReview',
    url: 'https://openreview.net',
    cls: OpenReview,
    canFetch: true,
    canSearch: false,
    deselectable: true,
  },
];
