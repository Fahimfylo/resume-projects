# Company Deduplication Solution

## Overview

This solution provides robust deduplication of companies from a contacts-based dataset where each contact document embeds company information.

## Problem Statement

- Multiple contacts belong to the same organization
- Duplicate companies appear in filters/search results
- Need clean, unique company list with zero duplication

## Solution Architecture

### Three Approaches Provided

1. **Node.js Deduplication** (`getUniqueCompaniesNodeJs`)
2. **Elasticsearch Aggregation** (`getUniqueCompaniesElasticsearch`)
3. **Hybrid Approach** (`getUniqueCompaniesHybrid`)

---

## Deduplication Logic

### Identifier Priority (Highest → Lowest)

1. **`organization_id`** - Most reliable unique identifier
2. **`organization_domain`** - Secondary unique identifier (normalized)
3. **`sanitized_organization_name_unanalyzed`** - Pre-processed name
4. **`organization_name`** - Fallback (normalized: lowercase + trimmed)

### Invalid Company Handling

Companies are **ignored** if:
- `organization_name` is null or empty
- ALL identifier fields are missing

### Normalization Rules

| Field | Normalization |
|-------|--------------|
| `organization_id` | Lowercase + trim |
| `organization_domain` | Lowercase + trim + remove protocol + remove www + remove trailing slashes |
| `organization_name` | Lowercase + trim + remove special characters |

---

## API Endpoints

### 1. Get Unique Companies

```http
GET /api/companies/unique?approach=nodejs&limit=1000&batchSize=1000
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `approach` | string | `nodejs` | Deduplication approach: `nodejs`, `elasticsearch`, `hybrid` |
| `limit` | number | 1000 | Maximum companies to return (max: 50000) |
| `batchSize` | number | 1000 | Batch size for processing (Node.js approach) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "Sysco",
      "domain": "sysco.com",
      "id": "57cf8a48a6da984c4213ccbc",
      "website": "https://www.sysco.com"
    },
    {
      "name": "Microsoft",
      "domain": "microsoft.com",
      "id": "5c3c8f5fe3c44b1f8a2d3e4f",
      "website": "https://www.microsoft.com"
    }
  ],
  "meta": {
    "uniqueCompaniesCount": 150,
    "totalContactsProcessed": 10000,
    "durationMs": 1250,
    "approach": "nodejs",
    "requestParams": {
      "approach": "nodejs",
      "limit": 1000,
      "batchSize": 1000
    }
  }
}
```

### 2. Search Companies

```http
GET /api/companies/search?q=sysco&field=all&limit=50
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | required | Search query (min 2 characters) |
| `field` | string | `all` | Search field: `name`, `domain`, `all` |
| `limit` | number | 50 | Maximum results |

### 3. Get Company Stats

```http
GET /api/companies/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUniqueCompanies": 5000,
    "withDomain": 4800,
    "withId": 4500,
    "withWebsite": 4200,
    "topLevelDomains": [
      { "tld": "com", "count": 3500 },
      { "tld": "io", "count": 500 }
    ],
    "nameLengthDistribution": {
      "1-10": 800,
      "11-20": 2500,
      "21-30": 1200,
      "31-50": 400,
      "50+": 100
    }
  },
  "meta": {
    "sampleSize": 5000,
    "durationMs": 850
  }
}
```

### 4. Get Company by ID

```http
GET /api/companies/57cf8a48a6da984c4213ccbc
```

---

## Approach Comparison

### Node.js Approach

**Best for:**
- Complex deduplication logic
- Smaller datasets (< 100k contacts)
- Full control over algorithm
- Fuzzy matching needs

**How it works:**
1. Fetches contacts in batches using `search_after` pagination
2. Extracts company data from each contact
3. Generates unique dedup key with priority fallback
4. Stores in JavaScript Map (automatic deduplication)
5. Merges duplicate records preserving best data

**Performance:**
- Memory: O(unique companies)
- Time: O(total contacts)
- Network: Multiple ES round-trips

### Elasticsearch Aggregation Approach

**Best for:**
- Large datasets (100k+ contacts)
- Maximum performance
- ES handles all computation

**How it works:**
1. Uses composite aggregation with multi-field grouping
2. Groups by: `organization_id` → `organization_domain` → `organization_name`
3. Returns top hits with company fields
4. Handles pagination with `after_key`

**Performance:**
- Memory: O(1) on Node.js side
- Time: Single ES query (complex)
- Network: Minimal round-trips

### Hybrid Approach

**Best for:**
- Production systems requiring both accuracy and performance
- Edge case handling

**How it works:**
1. First pass: ES aggregation for initial candidates
2. Second pass: Node.js refinement with complex logic
3. Merges both results with deduplication

---

## Code Structure

```
server/
├── services/
│   └── companyDeduplicationService.js   # Core deduplication logic
├── controllers/
│   └── companyController.js             # API endpoints
├── routes/
│   └── companyRoutes.js                 # Route definitions
└── docs/
    └── COMPANY_DEDUPLICATION.md         # This documentation
```

---

## Usage Examples

### Basic Usage (Node.js)

```javascript
const companyService = require('./services/companyDeduplicationService');

// Get unique companies
const result = await companyService.getUniqueCompaniesNodeJs({
  filters: {},
  batchSize: 1000,
  maxResults: 10000
});

console.log(`Found ${result.companies.length} unique companies`);
```

### With Filters

```javascript
// Filter by specific criteria
const result = await companyService.getUniqueCompaniesNodeJs({
  filters: {
    organization_industry: "Technology",
    organization_country: "USA"
  },
  batchSize: 1000,
  maxResults: 5000
});
```

### Large Dataset (Elasticsearch)

```javascript
// Use ES aggregation for large datasets
const result = await companyService.getUniqueCompaniesElasticsearch({
  filters: {},
  maxCompanies: 50000
});
```

---

## Error Handling

The solution includes comprehensive error handling:

- **Invalid Data:** Safely handles null/undefined fields
- **Missing Fields:** Skips records without valid identifiers
- **ES Failures:** Logs detailed error information
- **Timeouts:** Configurable batch sizes to prevent timeouts

---

## Performance Tuning

### For Small Datasets (< 10k contacts)
```javascript
{ approach: "nodejs", batchSize: 500, limit: 1000 }
```

### For Medium Datasets (10k-100k contacts)
```javascript
{ approach: "hybrid", limit: 5000 }
```

### For Large Datasets (> 100k contacts)
```javascript
{ approach: "elasticsearch", limit: 50000 }
```

---

## Testing

### Test the Endpoints

```bash
# Get unique companies (Node.js approach)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4000/api/companies/unique?approach=nodejs&limit=100"

# Search companies
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4000/api/companies/search?q=microsoft&field=name"

# Get stats
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4000/api/companies/stats"
```

---

## Future Enhancements

1. **Caching:** Redis cache for frequently accessed company lists
2. **Real-time Updates:** WebSocket updates when new contacts are added
3. **Fuzzy Matching:** Levenshtein distance for similar company names
4. **Company Enrichment:** Auto-fetch additional company data from external APIs
5. **Analytics Dashboard:** Track company deduplication metrics over time

---

## Support

For issues or questions, contact the Backend Engineering team.
