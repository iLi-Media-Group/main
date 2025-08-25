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
    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('instrument_categories')
      .select('*')
      .order('display_name');

    if (categoriesError) throw categoriesError;

    // Fetch instruments with category info
    const { data: instrumentsData, error: instrumentsError } = await supabase
      .from('instruments')
      .select('*')
      .order('display_name');

    if (instrumentsError) throw instrumentsError;

    const categories = categoriesData || [];
    const instruments = instrumentsData || [];

    // Add category info to instruments
    const instrumentsWithCategory: InstrumentWithCategory[] = instruments.map(instrument => ({
      ...instrument,
      category_info: categories.find(cat => cat.name === instrument.category)
    }));

    return {
      categories,
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
    const categoryName = instrument.category_info?.display_name || instrument.category;
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
  return instrument?.category_info?.display_name || instrument?.category || null;
}

export function getInstrumentsByCategory(categoryName: string, instruments: InstrumentWithCategory[]): InstrumentWithCategory[] {
  return instruments.filter(instrument => 
    instrument.category_info?.display_name === categoryName || 
    instrument.category === categoryName
  );
}

export function getCategories(instruments: InstrumentWithCategory[]): string[] {
  const categories = new Set<string>();
  instruments.forEach(instrument => {
    const categoryName = instrument.category_info?.display_name || instrument.category;
    if (categoryName) {
      categories.add(categoryName);
    }
  });
  return Array.from(categories).sort();
}
