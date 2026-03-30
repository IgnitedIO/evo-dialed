# Metrics Cache API Definitions

## Metrics Load Endpoint (with Cache)

### Endpoint

```
GET /api/internal/metrics/load
```

### Authentication

- **Required**: No (public/internal)

### Query Parameters

| Parameter       | Type    | Required | Description                                                   |
| --------------- | ------- | -------- | ------------------------------------------------------------- |
| `period`        | string  | No       | Time period (e.g., `24h`, `7d`, `30d`, `all`). Default: `30d` |
| `strict_period` | bool    | No       | If true, only include posts created within the period         |
| `campaign_id`   | integer | No       | Filter by campaign ID                                         |
| `creator_id`    | integer | No       | Filter by creator ID                                          |

### Request Examples

```bash
# Get 30-day metrics (default)
GET /api/internal/metrics/load

# Get 7-day metrics, strict period
GET /api/internal/metrics/load?period=7d&strict_period=true

# Get metrics for a specific campaign
GET /api/internal/metrics/load?campaign_id=1

# Get metrics for a specific creator
GET /api/internal/metrics/load?creator_id=1
```

### Response Structure

#### Success Response (200)

```json
{
  "data": {
    "metrics": {
      "total_views": 243300,
      "total_likes": 64390,
      "total_comments": 3839,
      "total_shares": 1889,
      "total_posts": 23,
      "ig_total_posts": 17,
      "tt_total_posts": 6,
      "engagement_rate": 0.2882
    },
    "creatorPerformance": [ ... ],
    "contentPerformance": [ ... ]
  },
  "cache": {
    "cache_key": "intl_anl_v2.4-7d_strict_cmp1",
    "cache_age_minutes": 5,
    "is_refreshing": false,
    "last_cached_ts": "2025-06-27T15:45:00.000Z",
    "last_refresh_ts": "2025-06-27T15:45:00.000Z"
  }
}
```

### Response Fields

#### Metrics Object

| Field             | Type    | Description                                                |
| ----------------- | ------- | ---------------------------------------------------------- |
| `total_views`     | integer | Cumulative total views across all posts                    |
| `total_likes`     | integer | Cumulative total likes across all posts                    |
| `total_comments`  | integer | Cumulative total comments across all posts                 |
| `total_shares`    | integer | Cumulative total shares across all posts                   |
| `total_posts`     | integer | Total number of posts                                      |
| `ig_total_posts`  | integer | Total number of Instagram posts                            |
| `tt_total_posts`  | integer | Total number of TikTok posts                               |
| `engagement_rate` | float   | (likes + comments + shares) / views (decimal, not percent) |

#### Cache Metadata Object

| Field               | Type    | Description                                         |
| ------------------- | ------- | --------------------------------------------------- |
| `cache_key`         | string  | Unique cache key for this query                     |
| `cache_age_minutes` | integer | Minutes since cache was last updated                |
| `is_refreshing`     | boolean | If true, cache is being refreshed in the background |
| `last_cached_ts`    | string  | ISO timestamp when cache was last written           |
| `last_refresh_ts`   | string  | ISO timestamp when cache was last refreshed         |

### Error Responses

#### 500 Internal Server Error

```json
{
  "error": "Failed to load metrics"
}
```

---

## Cache Status Endpoint

### Endpoint

```
GET /api/internal/metrics/cache-status
```

### Authentication

- **Required**: No (public/internal)

### Query Parameters

_None_

### Request Example

```bash
GET /api/internal/metrics/cache-status
```

### Response Structure

#### Success Response (200)

```json
{
  "has_cache": true,
  "is_refreshing": false,
  "cache_age_minutes": 5,
  "last_refresh_ts": "2025-06-27T15:45:00.000Z"
}
```

#### Fields

| Field               | Type    | Description                                 |
| ------------------- | ------- | ------------------------------------------- |
| `has_cache`         | boolean | True if cache exists for the current query  |
| `is_refreshing`     | boolean | True if cache is being refreshed            |
| `cache_age_minutes` | integer | Minutes since cache was last updated        |
| `last_refresh_ts`   | string  | ISO timestamp when cache was last refreshed |

#### Error Response

```json
{
  "error": "Cache status unavailable"
}
```

---

## Notes

- **Cache Strategy**: The first request for a new query is slow (cache miss, triggers DB query and cache write). Subsequent requests are fast (cache hit).
- **Cache Metadata**: All cacheable responses include metadata about cache age, refresh status, and timestamps.
- **Automatic Invalidation**: Cache is automatically invalidated when campaign-creator relationships change or new data is ingested.
- **Manual Invalidation**: (If exposed) You can clear or refresh cache via CLI or admin endpoints.
- **Engagement Rate**: Always returned as a decimal (e.g., 0.2882 for 28.82%). Multiply by 100 for percent in UI.
- **No Authentication**: Internal endpoints do not require user authentication by default.

---

For more details on the analytics data model or advanced cache management, see the main API documentation or contact the backend team.
