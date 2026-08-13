const { executeSearch } = require('./services/searchService');
(async () => {
  try {
    const result = await executeSearch({ userId: 'test_user', filters: {}, excludedFilters: {}, debugMode: false, forceRefresh: true });
    console.log('Search result (type):', typeof result);
    console.log('Result keys:', Object.keys(result));
    console.log('Counts:', result.counts);
    console.log('First result sample (if any):', result.results && result.results[0]);
  } catch (e) {
    console.error('executeSearch error:', e);
  }
})();
