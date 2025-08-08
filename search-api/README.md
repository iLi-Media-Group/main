# MyBeatFi Search API

A self-hosted search API with natural language processing, synonym expansion, and intelligent ranking.

## Features

- **Natural Language Processing**: Understands user intent from natural language queries
- **Synonym Expansion**: Automatically expands search terms using database synonyms
- **AND-first, OR-fallback**: Prioritizes exact matches, falls back to partial matches
- **Relevance Scoring**: Weighted scoring system for optimal result ranking
- **Search Logging**: Tracks all searches for analytics and popular searches
- **Popular/Recent Searches**: Returns trending and recent search queries

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   Create a `.env` file with:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   PORT=3001
   NODE_ENV=development
   ```

3. **Database setup**:
   Run the Supabase migrations to create the search tables:
   - `20250117000000_create_search_system.sql`
   - `20250117000001_convert_tracks_to_arrays.sql`

4. **Start the server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

### POST /api/search

Search for tracks with natural language processing.

**Request**:
```json
{
  "query": "jazzy energetic guitar for tv commercials",
  "userId": "optional-user-id",
  "limit": 20
}
```

**Response**:
```json
{
  "tracks": [
    {
      "id": "track-id",
      "title": "Track Title",
      "artist": "Artist Name",
      "genres": ["jazz", "smooth"],
      "subGenres": ["acid jazz"],
      "moods": ["energetic", "upbeat"],
      "instruments": ["guitar", "bass"],
      "mediaUsage": ["television", "commercial"],
      "duration": "3:30",
      "bpm": 120,
      "audioUrl": "https://...",
      "image": "https://...",
      "relevanceScore": 8,
      "producer": {
        "id": "producer-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      }
    }
  ],
  "popularSearches": [
    {
      "query": "jazz energetic",
      "search_count": 15
    }
  ],
  "recentSearches": [
    {
      "query": "peaceful piano",
      "created_at": "2024-01-17T10:30:00Z"
    }
  ],
  "searchStats": {
    "totalResults": 5,
    "searchTerms": ["jazzy", "energetic", "guitar", "tv", "commercials"],
    "expandedTerms": ["jazzy", "jazz", "smooth", "groovy", "energetic", "upbeat", "guitar", "television", "commercial"],
    "query": "jazzy energetic guitar for tv commercials"
  }
}
```

### GET /api/health

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

## Search Logic

1. **Query Parsing**: Splits natural language into search terms
2. **Synonym Expansion**: Expands each term using database synonyms
3. **Database Query**: Uses Postgres array operators for efficient searching
4. **Relevance Scoring**: 
   - Genres: +3 points
   - Sub-genres: +2 points
   - Moods: +2 points
   - Instruments: +1 point
   - Media usage: +1 point
   - Title match: +2 points
   - Artist match: +1 point
5. **Result Ranking**: Orders by relevance score, then by creation date

## Deployment

### Vercel
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy

### Render
1. Create a new Web Service
2. Connect your repository
3. Set environment variables
4. Deploy

### Heroku
1. Create a new app
2. Connect your repository
3. Set environment variables
4. Deploy

## Database Schema

### search_queries
- `id`: UUID primary key
- `user_id`: Optional user ID
- `query`: Search query text
- `created_at`: Timestamp

### search_synonyms
- `id`: UUID primary key
- `term`: Main term
- `synonyms`: Array of synonyms
- `created_at`: Timestamp

### tracks (updated)
- `genres_arr`: Array of genres
- `sub_genres_arr`: Array of sub-genres
- `moods_arr`: Array of moods
- `instruments_arr`: Array of instruments
- `media_usage_arr`: Array of media usage types

## Client Usage Example

```javascript
const searchTracks = async (query, userId = null) => {
  const response = await fetch('https://your-api-url.com/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      userId,
      limit: 20
    })
  });
  
  return await response.json();
};

// Usage
const results = await searchTracks('jazzy energetic guitar for tv commercials');
console.log(results.tracks);
console.log(results.popularSearches);
```
