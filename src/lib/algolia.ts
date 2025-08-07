import algoliasearch from 'algoliasearch';

// Initialize Algolia client
const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID || '',
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY || ''
);

// Initialize the index
export const tracksIndex = searchClient.initIndex('tracks');

// Search function for tracks
export const searchTracks = async (query: string, filters?: any) => {
  try {
    const searchParams: any = {
      query,
      hitsPerPage: 20,
      attributesToRetrieve: [
        'id',
        'title',
        'artist',
        'genres',
        'sub_genres',
        'moods',
        'bpm',
        'audio_url',
        'image_url',
        'has_sting_ending',
        'is_one_stop',
        'duration',
        'mp3_url',
        'trackouts_url',
        'stems_url',
        'has_vocals',
        'vocals_usage_type',
        'is_sync_only',
        'track_producer_id',
        'producer',
        'created_at'
      ],
      attributesToHighlight: ['title', 'artist', 'genres', 'moods'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>'
    };

    // Add filters
    if (filters) {
      const facetFilters: string[] = [];
      
      if (filters.isSyncOnly !== undefined) {
        facetFilters.push(`is_sync_only:${filters.isSyncOnly}`);
      }
      
      if (filters.hasVocals !== undefined) {
        facetFilters.push(`has_vocals:${filters.hasVocals}`);
      }
      
      if (filters.minBpm !== undefined || filters.maxBpm !== undefined) {
        const bpmFilter = [];
        if (filters.minBpm !== undefined) {
          bpmFilter.push(`bpm >= ${filters.minBpm}`);
        }
        if (filters.maxBpm !== undefined) {
          bpmFilter.push(`bpm <= ${filters.maxBpm}`);
        }
        searchParams.filters = bpmFilter.join(' AND ');
      }
      
      if (filters.genres && filters.genres.length > 0) {
        facetFilters.push(`genres:${filters.genres.join(' OR ')}`);
      }
      
      if (filters.moods && filters.moods.length > 0) {
        facetFilters.push(`moods:${filters.moods.join(' OR ')}`);
      }
      
      if (facetFilters.length > 0) {
        searchParams.facetFilters = facetFilters;
      }
    }

    const { hits, nbHits, page, nbPages } = await tracksIndex.search(query, searchParams);
    
    return {
      tracks: hits,
      totalHits: nbHits,
      currentPage: page,
      totalPages: nbPages
    };
  } catch (error) {
    console.error('Algolia search error:', error);
    throw error;
  }
};

// Index a track in Algolia
export const indexTrack = async (track: any) => {
  try {
    await tracksIndex.saveObject({
      objectID: track.id,
      ...track
    });
  } catch (error) {
    console.error('Error indexing track:', error);
    throw error;
  }
};

// Remove a track from Algolia index
export const removeTrackFromIndex = async (trackId: string) => {
  try {
    await tracksIndex.deleteObject(trackId);
  } catch (error) {
    console.error('Error removing track from index:', error);
    throw error;
  }
};

// Update a track in Algolia index
export const updateTrackInIndex = async (track: any) => {
  try {
    await tracksIndex.partialUpdateObject({
      objectID: track.id,
      ...track
    });
  } catch (error) {
    console.error('Error updating track in index:', error);
    throw error;
  }
};

// Get search suggestions
export const getSearchSuggestions = async (query: string) => {
  try {
    const { hits } = await tracksIndex.search(query, {
      hitsPerPage: 5,
      attributesToRetrieve: ['title', 'artist', 'genres', 'moods'],
      attributesToHighlight: ['title', 'artist'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>'
    });
    
    return hits;
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
};
