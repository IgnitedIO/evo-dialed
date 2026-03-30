# API Definitions

## Analytics Report Endpoint

### Endpoint

```
GET /api/metrics/report
```

### Authentication

- **Required**: Yes (User session)
- **Middleware**: `checkUserAuth`

### Query Parameters

| Parameter     | Type    | Required | Description                            |
| ------------- | ------- | -------- | -------------------------------------- |
| `campaign_id` | integer | No       | Filter results by specific campaign ID |
| `creator_id`  | integer | No       | Filter results by specific creator ID  |

### Request Examples

```bash
# Get overall report (all campaigns and creators)
GET /api/metrics/report

# Get campaign-specific report
GET /api/metrics/report?campaign_id=1

# Get creator-specific report
GET /api/metrics/report?creator_id=1

# Get filtered report
GET /api/metrics/report?campaign_id=1&creator_id=1
```

### Response Structure

#### Success Response (200)

```json
{
  "data": {
    "metrics": {
      "total_views": 96000,
      "total_likes": 4800,
      "total_comments": 960,
      "total_shares": 480,
      "total_posts": 6,
      "ig_total_posts": 4,
      "tt_total_posts": 2,
      "engagement_rate": 0.065
    },
    "creatorPerformance": [
      {
        "id": "1",
        "name": "John Creator",
        "profile_img": null,
        "platforms": ["ig"],
        "social": {
          "id": 1,
          "handle": "john_creator",
          "platform": "ig",
          "pfp": null
        },
        "total_views": 18000,
        "total_likes": 900,
        "total_comments": 180,
        "total_shares": 90,
        "engagement_rate": 0.065
      }
    ],
    "contentPerformance": [
      {
        "id": "3",
        "campaign_name": "Tech Product Launch",
        "created_ts": "2025-05-28T20:22:55.000Z",
        "post_ts": "2025-05-28T20:22:55.000Z",
        "caption": "New tech is here! #tech #innovation",
        "post_url": "https://tiktok.com/@user/video/456",
        "thumbnail": "https://example.com/thumb3.jpg",
        "creator_handle": null,
        "creator_pfp": null,
        "creator_name": null,
        "creator_platform": null,
        "user_name": "Mike Content",
        "user_pfp": null,
        "views": 28000,
        "likes": 1400,
        "comments": 280,
        "shares": 140,
        "creator": {
          "handle": null,
          "name": null,
          "platform": null,
          "user": {
            "name": "Mike Content",
            "pfp": null
          }
        },
        "metrics": {
          "views": 28000,
          "likes": 1400,
          "comments": 280,
          "shares": 140
        }
      }
    ]
  }
}
```

### Response Fields

#### Metrics Object

| Field             | Type    | Description                                                 |
| ----------------- | ------- | ----------------------------------------------------------- |
| `total_views`     | integer | Cumulative total views across all posts                     |
| `total_likes`     | integer | Cumulative total likes across all posts                     |
| `total_comments`  | integer | Cumulative total comments across all posts                  |
| `total_shares`    | integer | Cumulative total shares across all posts                    |
| `total_posts`     | integer | Total number of posts                                       |
| `ig_total_posts`  | integer | Total number of Instagram posts                             |
| `tt_total_posts`  | integer | Total number of TikTok posts                                |
| `engagement_rate` | float   | Overall engagement rate (likes + comments + shares) / views |

#### Creator Performance Array

| Field             | Type        | Description                                              |
| ----------------- | ----------- | -------------------------------------------------------- |
| `id`              | string      | Creator user ID                                          |
| `name`            | string      | Creator display name                                     |
| `profile_img`     | string/null | Creator profile image (base64 encoded)                   |
| `platforms`       | array       | Array of platforms the creator uses (e.g., ["ig", "tt"]) |
| `social`          | object/null | Social account information                               |
| `social.id`       | integer     | Social account ID                                        |
| `social.handle`   | string      | Social account handle                                    |
| `social.platform` | string      | Platform (ig/tt)                                         |
| `social.pfp`      | string/null | Social account profile picture                           |
| `total_views`     | integer     | Creator's cumulative total views                         |
| `total_likes`     | integer     | Creator's cumulative total likes                         |
| `total_comments`  | integer     | Creator's cumulative total comments                      |
| `total_shares`    | integer     | Creator's cumulative total shares                        |
| `engagement_rate` | float       | Creator's engagement rate                                |

#### Content Performance Array

| Field              | Type        | Description                           |
| ------------------ | ----------- | ------------------------------------- |
| `id`               | string      | Post ID (npc_id)                      |
| `campaign_name`    | string      | Campaign name                         |
| `created_ts`       | string      | ISO timestamp when post was submitted |
| `post_ts`          | string      | ISO timestamp when post was published |
| `caption`          | string      | Post caption                          |
| `post_url`         | string      | Direct link to the post               |
| `thumbnail`        | string      | Post thumbnail URL                    |
| `creator_handle`   | string/null | Creator's social handle               |
| `creator_pfp`      | string/null | Creator's profile picture             |
| `creator_name`     | string/null | Creator's display name                |
| `creator_platform` | string/null | Platform (ig/tt)                      |
| `user_name`        | string      | User's display name                   |
| `user_pfp`         | string/null | User's profile picture                |
| `views`            | integer     | Post views (latest metrics)           |
| `likes`            | integer     | Post likes (latest metrics)           |
| `comments`         | integer     | Post comments (latest metrics)        |
| `shares`           | integer     | Post shares (latest metrics)          |
| `creator`          | object      | Creator information object            |
| `metrics`          | object      | Post metrics object                   |

### Error Responses

#### 400 Bad Request

```json
{
  "error": "Invalid campaign_id parameter"
}
```

#### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Failed to generate report"
}
```

### Notes

- **Cumulative Metrics**: All metrics are cumulative totals (all-time), not incremental
- **No Time Period**: Results are always all-time, regardless of any time period parameters
- **All Creators**: Returns all creators (no limit), unlike metrics endpoint which limits to 25
- **Top Posts**: Returns top 20 performing posts by views
- **Latest Metrics**: Post metrics represent the latest recorded metrics for each post
- **Platform Support**: Supports both Instagram (ig) and TikTok (tt) platforms
