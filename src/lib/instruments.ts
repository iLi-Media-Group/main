import { supabase } from './supabase';

export interface Instrument {
  id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface SubInstrument {
  id: string;
  instrument_id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface InstrumentWithSubInstruments extends Instrument {
  sub_instruments: SubInstrument[];
}

export interface InstrumentsData {
  instruments: InstrumentWithSubInstruments[];
  allSubInstruments: SubInstrument[];
}

export async function fetchInstrumentsData(): Promise<InstrumentsData> {
  try {
    const { data: instrumentsData, error: instrumentsError } = await supabase
      .from('instruments')
      .select(`
        *,
        sub_instruments (*)
      `)
      .order('display_name');

    if (instrumentsError) throw instrumentsError;

    const instruments = instrumentsData || [];
    const allSubInstruments = instruments.flatMap(instrument => instrument.sub_instruments);

    return {
      instruments,
      allSubInstruments
    };
  } catch (error) {
    console.error('Error fetching instruments:', error);
    throw error;
  }
}

export function formatInstrumentsForDisplay(instruments: InstrumentWithSubInstruments[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  instruments.forEach(instrument => {
    formatted[instrument.display_name] = instrument.sub_instruments.map(sub => sub.display_name);
  });
  
  return formatted;
}

export function getAllSubInstruments(instruments: InstrumentWithSubInstruments[]): string[] {
  return instruments.flatMap(instrument => 
    instrument.sub_instruments.map(sub => sub.display_name)
  );
}

export function getInstrumentCategory(subInstrumentName: string, instruments: InstrumentWithSubInstruments[]): string | null {
  for (const instrument of instruments) {
    const found = instrument.sub_instruments.find(sub => 
      sub.display_name.toLowerCase() === subInstrumentName.toLowerCase()
    );
    if (found) {
      return instrument.display_name;
    }
  }
  return null;
}
