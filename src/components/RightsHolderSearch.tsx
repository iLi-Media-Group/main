import React, { useState, useEffect } from 'react';
import { Building2, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RightsHolder {
  id: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  rights_holder_type: 'record_label' | 'publisher';
}

interface RightsHolderSearchProps {
  value: string;
  onChange: (rightsHolderId: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function RightsHolderSearch({ value, onChange, disabled = false, required = false }: RightsHolderSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rightsHolders, setRightsHolders] = useState<RightsHolder[]>([]);
  const [filteredRightsHolders, setFilteredRightsHolders] = useState<RightsHolder[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRightsHolders();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const filtered = rightsHolders.filter(rightsHolder => {
        const companyName = (rightsHolder.company_name || '').toLowerCase();
        const fullName = `${rightsHolder.first_name || ''} ${rightsHolder.last_name || ''}`.toLowerCase();
        const email = rightsHolder.email.toLowerCase();
        return companyName.includes(searchLower) || 
               fullName.includes(searchLower) || 
               email.includes(searchLower);
      });
      setFilteredRightsHolders(filtered);
    } else {
      setFilteredRightsHolders(rightsHolders);
    }
  }, [searchTerm, rightsHolders]);

  const fetchRightsHolders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_name, first_name, last_name, email, rights_holder_type')
        .eq('account_type', 'rights_holder')
        .order('company_name', { ascending: true });

      if (error) throw error;

      if (data) {
        const validRightsHolders = data.filter(rh => 
          rh.email && (rh.company_name || rh.first_name || rh.last_name || rh.email)
        );
        setRightsHolders(validRightsHolders);

        // If there's a selected value, find and display the rights holder's name
        if (value) {
          const selectedRightsHolder = validRightsHolders.find(rh => rh.id === value);
          if (selectedRightsHolder) {
            setSearchTerm(getRightsHolderDisplayName(selectedRightsHolder));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching rights holders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRightsHolderDisplayName = (rightsHolder: RightsHolder): string => {
    if (rightsHolder.company_name) {
      return `${rightsHolder.company_name} (${rightsHolder.rights_holder_type === 'record_label' ? 'Record Label' : 'Publisher'})`;
    }
    
    const name = [rightsHolder.first_name, rightsHolder.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    
    if (name) {
      return `${name} (${rightsHolder.rights_holder_type === 'record_label' ? 'Record Label' : 'Publisher'})`;
    }
    
    return rightsHolder.email;
  };

  const handleSelect = (rightsHolder: RightsHolder) => {
    setSearchTerm(getRightsHolderDisplayName(rightsHolder));
    onChange(rightsHolder.id);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full pl-10 pr-10"
          placeholder="Search record labels and publishers..."
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

      {showDropdown && (
        <div className="absolute z-[9999] w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredRightsHolders.map((rightsHolder) => (
            <button
              key={rightsHolder.id}
              type="button"
              onClick={() => handleSelect(rightsHolder)}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
            >
              <div className="text-white font-medium">
                {getRightsHolderDisplayName(rightsHolder)}
              </div>
              <div className="text-sm text-gray-400">{rightsHolder.email}</div>
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
