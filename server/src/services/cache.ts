import NodeCache from 'node-cache';

export const searchCache = new NodeCache({
  stdTTL: 60,
  useClones: false,
});

export const cacheKeyFrom = (namespace: string, payload: object): string =>
  `${namespace}:${JSON.stringify(payload)}`;
