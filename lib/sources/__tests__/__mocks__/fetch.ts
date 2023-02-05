import _responses from './responses.json';
const responses: Record<string, string> = _responses;

const fetch = jest.fn((input: RequestInfo | URL) => {
  if (responses[input.toString()] === undefined) {
    console.warn(`${input.toString()} is not mocked.`)
    return Promise.reject(`${input.toString()} is not mocked.`);
  } else {
    return Promise.resolve({
      status: 200,
      text: () => Promise.resolve(responses[input.toString()]),
      json: () => Promise.resolve(JSON.parse(responses[input.toString()])),
    } as Response);
  }
});

export default fetch;
