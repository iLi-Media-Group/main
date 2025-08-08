// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // lock this down in production
  methods: ['POST','GET','OPTIONS']
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Supabase DATABASE_URL
  ssl: { rejectUnauthorized: false } // depending on your hosting
});

/**
 * helpers
 */
const safeArray = (v) => Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []);

async function expandWithSynonyms(client, terms) {
  // terms is array of strings
  if (!terms || terms.length === 0) return [];
  // Normalize to lower-case trimmed
  const normalized = terms.map(t => t.trim().toLowerCase()).filter(Boolean);
  // Query synonyms rows where term IN normalized OR synonyms && normalized
  const { rows } = await client.query(
    `SELECT term, synonyms FROM public.search_synonyms
     WHERE lower(term) = ANY($1) OR EXISTS (
       SELECT 1 FROM unnest(synonyms) s WHERE lower(s) = ANY($1)
     )`,
    [normalized]
  );
  const expanded = new Set(normalized);
  for (const r of rows) {
    expanded.add(r.term.toLowerCase());
    (r.synonyms || []).forEach(s => expanded.add(String(s).toLowerCase()));
  }
  return Array.from(expanded);
}

/**
 * Build dynamic WHERE clauses for array-overlap (&&).
 * Only include clauses for fields that have terms.
 */
function buildAndWhereClauses(criteria, params) {
  const clauses = [];
  let idx = params.length;
  for (const k of ['genres', 'sub_genres', 'moods', 'usage_types']) {
    const arr = criteria[k];
    if (arr && arr.length) {
      idx++;
      // we use $n::text[] and overlapping operator &&
      clauses.push(`${k} && $${idx}::text[]`);
      params.push(arr);
    }
  }
  return clauses;
}

/**
 * The main POST /search endpoint
 * body: { query, genres[], subgenres[], moods[], usageTypes[], limit }
 */
app.post('/search', async (req, res) => {
  const {
    query = '',
    genres = [],
    subgenres = [],
    moods = [],
    usageTypes = [],
    limit = 40
  } = req.body || {};

  const client = await pool.connect();
  try {
    // --- 1) Normalize and expand terms with synonyms ---
    const genreTerms = (genres || []).map(s => String(s).trim()).filter(Boolean);
    const subgenreTerms = (subgenres || []).map(s => String(s).trim()).filter(Boolean);
    const moodTerms = (moods || []).map(s => String(s).trim()).filter(Boolean);
    const usageTerms = (usageTypes || []).map(s => String(s).trim()).filter(Boolean);

    // Expand using synonyms table (async)
    const [expandedGenres, expandedSubgenres, expandedMoods, expandedUsage] = await Promise.all([
      expandWithSynonyms(client, genreTerms),
      expandWithSynonyms(client, subgenreTerms),
      expandWithSynonyms(client, moodTerms),
      expandWithSynonyms(client, usageTerms),
    ]);

    // Also parse raw text query into tokens (simple split)
    const tokens = String(query || '').toLowerCase().split(/\s+/).map(t => t.trim()).filter(Boolean);

    // Save log entry (non-blocking but we'll await it)
    const insertLogText = `
      INSERT INTO public.search_queries (user_id, query, genres, subgenres, moods, media_usage_types)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    // user_id will be null for anonymous; you can send auth info in header if you want
    await client.query(insertLogText, [
      null,
      query,
      expandedGenres.length ? expandedGenres : null,
      expandedSubgenres.length ? expandedSubgenres : null,
      expandedMoods.length ? expandedMoods : null,
      expandedUsage.length ? expandedUsage : null
    ]);

    // --- 2) Prepare AND-first strict search ---
    // We'll dynamically build SQL to require all provided non-empty criteria (overlap operator).
    const andParams = [];
    const criteria = {
      genres: expandedGenres,
      sub_genres: expandedSubgenres,
      moods: expandedMoods,
      usage_types: expandedUsage
    };

    const andClauses = buildAndWhereClauses(criteria, andParams);

    // Also include tokens in text search if provided (we search title, description, maybe tags)
    const textClauses = [];
    if (tokens.length) {
      // Use simple ILIKE matches for tokens combined with AND
      tokens.forEach(tok => {
        andParams.push(`%${tok}%`);
        textClauses.push(`(title ILIKE $${andParams.length} OR description ILIKE $${andParams.length})`);
      });
    }

    const strictClauses = [...andClauses];
    if (textClauses.length) {
      strictClauses.push(...textClauses);
    }

    let rows = [];
    if (strictClauses.length) {
      const strictSql = `
        SELECT *, (
           -- score heuristic: how many overlaps + text matches
           (coalesce(array_length(array(SELECT unnest(genres) INTERSECT SELECT unnest($1::text[])),1),0)
            + coalesce(array_length(array(SELECT unnest(sub_genres) INTERSECT SELECT unnest($2::text[])),1),0)
            + coalesce(array_length(array(SELECT unnest(moods) INTERSECT SELECT unnest($3::text[])),1),0)
            + coalesce(array_length(array(SELECT unnest(usage_types) INTERSECT SELECT unnest($4::text[])),1),0)
           )::int
        ) as relevance
        FROM public.tracks
        WHERE ${strictClauses.join(' AND ')}
        ORDER BY relevance DESC NULLS LAST, created_at DESC
        LIMIT $${andParams.length + 1}
      `;
      // Make sure params mapping matches placeholders used in strictSql:
      // Because buildAndWhereClauses appended arrays in andParams in the order genres, sub_genres, moods, usage_types.
      // We also appended text tokens after that. To satisfy the SELECT intersection parts we must pass 4 arrays (maybe empty).
      const pGenres = criteria.genres.length ? criteria.genres : [];
      const pSub = criteria.sub_genres.length ? criteria.sub_genres : [];
      const pMoods = criteria.moods.length ? criteria.moods : [];
      const pUsage = criteria.usage_types.length ? criteria.usage_types : [];
      // Construct final params array: [pGenres, pSub, pMoods, pUsage, ...andParamsTextForILIKE..., limit]
      const finalParams = [pGenres, pSub, pMoods, pUsage];
      // andParams currently holds the overlap arrays + ILIKE patterns. We must append only the ILIKE patterns (if any) after the first 4
      // But buildAndWhereClauses already pushed overlap arrays into andParams. So andParams looks like [genresArr?, subArr?, moodsArr?, usageArr?, tokenPattern1?, tokenPattern2?...]
      // For simpler mapping we'll rebuild parameter list:
      const ilikePatterns = tokens.map(t => `%${t}%`);
      const queryParamArr = [pGenres, pSub, pMoods, pUsage, ...ilikePatterns, Number(limit || 40)];
      const strictRes = await client.query(strictSql, queryParamArr);
      rows = strictRes.rows || [];
    } else {
      // No strict criteria: fallback to a basic text search (if query tokens) or return recent/popular
      if (tokens.length) {
        const textSql = `
          SELECT *, 0 as relevance
          FROM public.tracks
          WHERE ${tokens.map((_, i) => `(title ILIKE $${i+1} OR description ILIKE $${i+1})`).join(' AND ')}
          ORDER BY created_at DESC
          LIMIT $${tokens.length + 1}
        `;
        const textParams = tokens.map(t => `%${t}%`).concat([Number(limit || 40)]);
        const textRes = await client.query(textSql, textParams);
        rows = textRes.rows || [];
      } else {
        const recentSql = `
          SELECT *, 0 as relevance
          FROM public.tracks
          ORDER BY created_at DESC
          LIMIT $1
        `;
        const recentRes = await client.query(recentSql, [Number(limit || 40)]);
        rows = recentRes.rows || [];
      }
    }

    // --- 3) If not enough results, run OR fallback (looser) ---
    const MIN_RESULTS = 20;
    if ((rows || []).length < MIN_RESULTS) {
      // Build OR conditions: overlap on any of the arrays OR token ILIKE any
      const orParts = [];
      const orParams = [];
      if ((criteria.genres || []).length) {
        orParams.push(criteria.genres);
        orParts.push(`genres && $${orParams.length}::text[]`);
      }
      if ((criteria.sub_genres || []).length) {
        orParams.push(criteria.sub_genres);
        orParts.push(`sub_genres && $${orParams.length}::text[]`);
      }
      if ((criteria.moods || []).length) {
        orParams.push(criteria.moods);
        orParts.push(`moods && $${orParams.length}::text[]`);
      }
      if ((criteria.usage_types || []).length) {
        orParams.push(criteria.usage_types);
        orParts.push(`usage_types && $${orParams.length}::text[]`);
      }
      // tokens -> ILIKE patterns ORed
      tokens.forEach(tok => {
        orParams.push(`%${tok}%`);
        orParts.push(`(title ILIKE $${orParams.length} OR description ILIKE $${orParams.length})`);
      });

      if (orParts.length) {
        const orSql = `
          SELECT *, 0 as relevance
          FROM public.tracks
          WHERE ${orParts.join(' OR ')}
          ORDER BY created_at DESC
          LIMIT $${orParams.length + 1}
        `;
        const orFinalParams = [...orParams, Number(limit || 40)];
        const orRes = await client.query(orSql, orFinalParams);
        // Merge keeping unique IDs and preserving strict results first
        const ids = new Set(rows.map(r => r.id));
        for (const r of (orRes.rows || [])) {
          if (!ids.has(r.id)) {
            rows.push(r);
            ids.add(r.id);
          }
          if (rows.length >= limit) break;
        }
      }
    }

    // --- 4) Popular & recent searches (small lists) ---
    const popularRes = await client.query(`
      SELECT query, count(*) as hits
      FROM public.search_queries
      WHERE created_at > now() - interval '30 days'
      GROUP BY query
      ORDER BY hits DESC
      LIMIT 10
    `);
    const recentRes = await client.query(`
      SELECT query
      FROM public.search_queries
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      ok: true,
      results: rows,
      meta: {
        count: rows.length,
        popularSearches: popularRes.rows || [],
        recentSearches: (recentRes.rows || []).map(r => r.query)
      }
    });
  } catch (err) {
    console.error('Search error', err);
    res.status(500).json({ ok:false, error: err.message || String(err) });
  } finally {
    client.release();
  }
});

const port = process.env.PORT || 4001;
app.listen(port, () => console.log(`Search API listening on ${port}`));
