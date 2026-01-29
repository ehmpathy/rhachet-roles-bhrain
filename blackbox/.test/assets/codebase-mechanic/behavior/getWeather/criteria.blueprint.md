# criteria.blueprint: getWeather

## architecture

- `getWeather.ts` - main operation
- `weatherApi.ts` - api client wrapper
- `weatherCache.ts` - response cache layer

## dependencies

- axios for http requests
- lru-cache for response cache

## error strategy

- wrap api errors with HelpfulError
- include location in error metadata
- implement exponential backoff for retries
