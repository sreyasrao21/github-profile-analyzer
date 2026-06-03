# GitHub Profile Analyzer API

Analyze GitHub user profiles and store insights in MySQL.

## Tech Stack

- Node.js + Express.js
- MySQL
- GitHub REST API

## Setup

1. Clone the repo
2. Run `npm install`
3. Create a MySQL database and run `database/schema.sql`
4. Copy `.env` and fill in your MySQL credentials (optionally add a `GITHUB_TOKEN` for higher rate limits)
5. Run `npm start` or `npm run dev` (with nodemon)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/profiles/:username` | Fetch & store a GitHub profile |
| GET | `/api/profiles` | List profiles (supports `?search=&sortBy=&order=&limit=&offset=`) |
| GET | `/api/profiles/:username` | Get a stored profile by username |
| DELETE | `/api/profiles/:username` | Delete a stored profile |
| GET | `/api/profiles/stats` | Aggregate stats (total, avg followers/repos, top users) |
| GET | `/api/profiles/export/csv` | Download all profiles as CSV |

## Query Parameters (GET /api/profiles)

| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by username, name, location, or company |
| sortBy | string | Sort field: followers, public_repos, username, name, created_at, updated_at |
| order | string | asc or desc (default: desc) |
| limit | number | Limit results |
| offset | number | Offset for pagination |

## Stored Insights

- Name, bio, company, location, email, blog, Twitter handle
- Avatar URL, profile URL
- Public repos, public gists, followers, following counts
- GitHub account creation date
- Auto-timestamps for when the record was created/updated
