import React, { useState, useEffect } from 'react';
import { Music, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Artist {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  company_name: string | null;
}

interface ArtistSearchProps {
  value: string;
  onChange: (artistId: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function ArtistSearch({ value, onChange, disabled = false, required = false }: ArtistSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const filtered = artists.filter(artist => {
        const fullName = `${artist.first_name || ''} ${artist.last_name || ''}`.toLowerCase();
        const companyName = (artist.company_name || '').toLowerCase();
        return fullName.includes(searchLower) || 
               companyName.includes(searchLower) || 
               artist.email.toLowerCase().includes(searchLower);
      });
      setFilteredArtists(filtered);
      setShowDropdown(true);
    } else {
      setFilteredArtists([]);
      setShowDropdown(false);
    }
  }, [searchTerm, artists]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, company_name')
        .eq('account_type', 'artist_band')
        .order('first_name', { ascending: true });

      if (error) throw error;

      if (data) {
        const validArtists = data.filter(a => a.email && (a.first_name || a.last_name || a.company_name || a.email));
        setArtists(validArtists);

        // If there's a selected value, find and display the artist's name
        if (value) {
          const selectedArtist = validArtists.find(a => a.id === value);
          if (selectedArtist) {
            setSearchTerm(getArtistDisplayName(selectedArtist));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
    } finally {
      setLoading(false);
    }
  };

  const getArtistDisplayName = (artist: Artist): string => {
    if (artist.company_name) {
      return artist.company_name;
    }
    
    const name = [artist.first_name, artist.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    
    return name || artist.email;
  };

  const handleSelect = (artist: Artist) => {
    setSearchTerm(getArtistDisplayName(artist));
    onChange(artist.id);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="w-full pl-10 pr-10"
          placeholder="Search artists/bands..."
          disabled={disabled}
          required={required}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && filteredArtists.length > 0 && (
        <div className="absolute z-[9999] w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredArtists.map((artist) => (
            <button
              key={artist.id}
              type="button"
              onClick={() => handleSelect(artist)}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
            >
              <div className="text-white font-medium">
                {getArtistDisplayName(artist)}
              </div>
              <div className="text-sm text-gray-400">{artist.email}</div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
    </div>
  );
}
