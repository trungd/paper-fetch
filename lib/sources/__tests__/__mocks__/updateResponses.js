/* eslint-disable */
// node ./src/common/sources/__tests__/mocked/updateResponses.js

const fetch = require('node-fetch');
const requests = require('./requests.json');
const fs = require('fs');

(async () => {
  const fileContent = fs.readFileSync(
    './lib/sources/__tests__/__mocks__/responses.json',
    'utf8'
  );
  const ret = JSON.parse(fileContent);
  for (const req of requests) {
    if (ret[req]) continue;
    const res = await fetch(req);
    ret[req] = await res.text();
    console.log(req);
  }

  fs.writeFileSync(
    './lib/sources/__tests__/__mocks__/responses.json',
    JSON.stringify(ret)
  );
})();
