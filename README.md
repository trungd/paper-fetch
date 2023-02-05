# paper-fetch

`paper-fetch` is a library to search for papers and fetch information about a paper from open-access APIs.

## Installation

```
yarn add paper-fetch
// or
npm install paper-fetch
```

## Usage

### Fetching a paper

```js
import {fetchPaper, PaperQuery} from 'paper-fetch';
const paperQuery: PaperQuery = {
  semanticScholarId: '2c03df8b48bf3fa39054345bafabfeff15bfd11d'
};
const paper = fetchPaper(
    paperQuery, 
    ['arxiv', 'semanticScholar', 'crossRef', 'openReview']).then(
      (p) => console.log(p));

// Logs: {
//   title: 'Deep Residual Learning for Image Recognition',
//   ...
// }
```

### Searching for papers

```js
import {searchPapers, PaperQuery} from 'paper-fetch';
const papers = searchPapers(
    'Deep Residual Learning for Image Recognition',
    ['arxiv', 'semanticScholar']).then(
      (ps) => console.log(ps));
// Logs: [
//   {
//     title: 'Deep Residual Learning for Image Recognition',
//     ...
//   },
//   ...
// ]
```

## Returned Fields

`paper-fetch` returns a `Paper` object with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title of the paper. |
| `authors` | `Author[]` | The authors of the paper. |
| `abstract` | `string` | The abstract of the paper. |
| `pdfUrl` | `string` | The URL of the PDF of the paper. |
| `ids` | `Record<string, string>` | The IDs of the paper. |
| `venue` | `string` | The venue of the paper. |
| `year` | `number` | The year of the paper. |
| `numCitations` | `number` | The number of citations of the paper. |
| `numReferences` | `number` | The number of references of the paper. |
| `tldr` | `string` | The TL;DR of the paper. |
| `affliations` | `string[]` | The affliations of the authors. |
| `autoTags` | `string[]` | The auto tags of the paper. |
| `sources` | `Record<SourceKey, SourcePaper>` | Data returned by each source. |
| `urls` | `Url[]` | List of URLs related to the paper. |
