import { supabase } from './supabase';

export interface InstrumentCategory {
  id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Instrument {
  id: string;
  name: string;
  display_name: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface InstrumentWithCategory extends Instrument {
  category_info?: InstrumentCategory;
}

export interface InstrumentsData {
  categories: InstrumentCategory[];
  instruments: InstrumentWithCategory[];
}

export async function fetchInstrumentsData(): Promise<InstrumentsData> {
  try {
    // Use predefined categories since instrument_categories table doesn't exist in current schema
    const predefinedCategories: InstrumentCategory[] = [
      { id: 'strings', name: 'strings', display_name: 'Strings', created_at: '', updated_at: '' },
      { id: 'keys', name: 'keys', display_name: 'Keys', created_at: '', updated_at: '' },
      { id: 'drums-percussion', name: 'drums-percussion', display_name: 'Drums & Percussion', created_at: '', updated_at: '' },
      { id: 'woodwinds-brass', name: 'woodwinds-brass', display_name: 'Woodwinds & Brass', created_at: '', updated_at: '' },
      { id: 'orchestral-strings', name: 'orchestral-strings', display_name: 'Orchestral Strings', created_at: '', updated_at: '' },
      { id: 'vocals', name: 'vocals', display_name: 'Vocals', created_at: '', updated_at: '' },
      { id: 'bass', name: 'bass', display_name: 'Bass', created_at: '', updated_at: '' },
      { id: 'atmosphere-texture', name: 'atmosphere-texture', display_name: 'Atmosphere & Texture', created_at: '', updated_at: '' },
      { id: 'sound-effects', name: 'sound-effects', display_name: 'Sound Effects', created_at: '', updated_at: '' },
      { id: 'samples-loops', name: 'samples-loops', display_name: 'Samples & Loops', created_at: '', updated_at: '' },
      { id: 'other', name: 'other', display_name: 'Other', created_at: '', updated_at: '' }
    ];

    // Fetch instruments with category info
    const { data: instrumentsData, error: instrumentsError } = await supabase
      .from('instruments')
      .select('*')
      .order('category, display_name');

    if (instrumentsError) throw instrumentsError;

    const instruments = instrumentsData || [];

    // Add category info to instruments
    const instrumentsWithCategory: InstrumentWithCategory[] = instruments.map(instrument => ({
      ...instrument,
      category_info: predefinedCategories.find(cat => cat.name === instrument.category)
    }));

    return {
      categories: predefinedCategories,
      instruments: instrumentsWithCategory
    };
  } catch (error) {
    console.error('Error fetching instruments:', error);
    throw error;
  }
}

export function formatInstrumentsForDisplay(instruments: InstrumentWithCategory[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  instruments.forEach(instrument => {
    const categoryName = instrument.category_info?.display_name || 'Unknown';
    if (!formatted[categoryName]) {
      formatted[categoryName] = [];
    }
    formatted[categoryName].push(instrument.display_name);
  });

  return formatted;
}

export function getAllInstruments(instruments: InstrumentWithCategory[]): string[] {
  return instruments.map(instrument => instrument.display_name);
}

export function getInstrumentCategory(instrumentName: string, instruments: InstrumentWithCategory[]): string | null {
  const instrument = instruments.find(inst => 
    inst.display_name.toLowerCase() === instrumentName.toLowerCase()
  );
  return instrument?.category_info?.display_name || null;
}

export function getInstrumentsByCategory(categoryName: string, instruments: InstrumentWithCategory[]): InstrumentWithCategory[] {
  return instruments.filter(instrument => 
    instrument.category_info?.display_name === categoryName
  );
}

export function getCategories(instruments: InstrumentWithCategory[]): string[] {
  const categories = new Set<string>();
  instruments.forEach(instrument => {
    const categoryName = instrument.category_info?.display_name;
    if (categoryName) {
      categories.add(categoryName);
    }
  });
  return Array.from(categories).sort();
}
