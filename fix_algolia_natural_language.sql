-- Fix Algolia Natural Language Search Configuration
-- This script will help you configure Algolia for proper natural language search

-- First, let's check what data we have for searchable attributes
SELECT 'GENRES' as category, name as item FROM genres ORDER BY name;
SELECT 'SUB-GENRES' as category, name as item FROM sub_genres ORDER BY name;
SELECT 'INSTRUMENT CATEGORIES' as category, name as item FROM instrument_categories ORDER BY name;
SELECT 'INSTRUMENTS' as category, i.name as item, ic.name as subcategory
FROM instruments i
JOIN instrument_categories ic ON i.category = ic.id
ORDER BY ic.name, i.name;

-- ========================================
-- ALGOLIA CONFIGURATION RECOMMENDATIONS
-- ========================================

/*
1. ALGOLIA DASHBOARD SETTINGS:

Searchable Attributes (in order of importance):
- title
- artist  
- genres
- sub_genres
- moods
- instruments
- description (if you have one)

2. SYNONYMS CONFIGURATION:
Add these synonyms in your Algolia Dashboard:

Natural Language → Synonyms:
- "happy" → ["cheerful", "joyful", "uplifting", "positive"]
- "sad" → ["melancholic", "melancholy", "sorrowful", "emotional"]
- "energetic" → ["energetic", "lively", "bouncy", "upbeat", "dynamic"]
- "calm" → ["peaceful", "soothing", "gentle", "relaxing", "tranquil"]
- "romantic" → ["romantic", "intimate", "passionate", "emotional"]
- "epic" → ["dramatic", "majestic", "powerful", "heroic", "grand"]
- "chill" → ["chill", "laid back", "relaxing", "soothing", "peaceful"]
- "upbeat" → ["upbeat", "energetic", "lively", "bouncy", "cheerful"]
- "mysterious" → ["mysterious", "haunting", "dark", "enigmatic", "atmospheric"]
- "peaceful" → ["peaceful", "soothing", "gentle", "calm", "tranquil"]
- "dramatic" → ["dramatic", "intense", "powerful", "emotional", "epic"]
- "relaxing" → ["relaxing", "soothing", "peaceful", "gentle", "calm"]
- "exciting" → ["energetic", "lively", "dynamic", "powerful", "intense"]
- "smooth" → ["smooth", "gentle", "soothing", "peaceful", "relaxing"]
- "powerful" → ["powerful", "dramatic", "intense", "energetic", "dynamic"]
- "soft" → ["gentle", "soft", "peaceful", "soothing", "calm"]
- "intense" → ["intense", "dramatic", "powerful", "energetic", "dynamic"]
- "gentle" → ["gentle", "soft", "peaceful", "soothing", "calm"]
- "lively" → ["lively", "energetic", "bouncy", "cheerful", "dynamic"]
- "melancholic" → ["melancholic", "melancholy", "sorrowful", "emotional"]
- "euphoric" → ["euphoric", "uplifting", "energetic", "positive", "cheerful"]
- "dreamy" → ["dreamy", "ethereal", "peaceful", "soothing", "gentle"]
- "stylish" → ["stylish", "cool", "smooth", "elegant", "sophisticated"]
- "cool" → ["cool", "stylish", "smooth", "elegant", "sophisticated"]
- "catchy" → ["catchy", "bouncy", "cheerful", "energetic", "lively"]
- "encouraging" → ["encouraging", "uplifting", "positive", "energetic", "cheerful"]
- "funky" → ["funky", "groovy", "energetic", "bouncy", "lively"]
- "ethereal" → ["ethereal", "dreamy", "peaceful", "soothing", "gentle"]
- "enchanted" → ["enchanted", "mysterious", "ethereal", "dreamy", "magical"]
- "dreamlike" → ["dreamlike", "ethereal", "dreamy", "peaceful", "soothing"]
- "carefree" → ["carefree", "cheerful", "playful", "joyful", "bouncy"]
- "celebratory" → ["celebratory", "joyful", "cheerful", "energetic", "bouncy"]
- "confident" → ["confident", "powerful", "energetic", "dynamic", "positive"]
- "optimistic" → ["optimistic", "positive", "cheerful", "uplifting", "energetic"]
- "cheerful" → ["cheerful", "joyful", "bouncy", "playful", "energetic"]
- "uplifting" → ["uplifting", "positive", "energetic", "cheerful", "encouraging"]
- "positive" → ["positive", "cheerful", "optimistic", "uplifting", "energetic"]
- "tense" → ["tense", "dramatic", "intense", "mysterious", "haunting"]
- "haunting" → ["haunting", "mysterious", "dark", "ethereal", "atmospheric"]
- "soothing" → ["soothing", "peaceful", "gentle", "relaxing", "calm"]
- "intimate" → ["intimate", "romantic", "gentle", "emotional", "passionate"]
- "elegant" → ["elegant", "sophisticated", "stylish", "smooth", "cool"]
- "sophisticated" → ["sophisticated", "elegant", "stylish", "smooth", "cool"]
- "magical" → ["magical", "enchanted", "ethereal", "mysterious", "dreamy"]

Instrument Synonyms:
- "guitar" → ["Acoustic Guitar", "Electric Guitar"]
- "bass" → ["Bass Guitar"]
- "piano" → ["Piano", "Electric Piano"]
- "synth" → ["Synthesizer"]
- "drums" → ["Drums", "Drum Machine", "Bass Drum", "Snare Drum", "Hi-Hat"]
- "violin" → ["Violin"]
- "cello" → ["Cello"]
- "harp" → ["Harp"]
- "trumpet" → ["Trumpet"]
- "sax" → ["Saxophone", "Alto Sax", "Tenor Sax", "Baritone Sax", "Soprano Sax"]
- "flute" → ["Flute"]
- "clarinet" → ["Clarinet"]
- "organ" → ["Organ", "Hammond Organ"]
- "accordion" → ["Accordion"]
- "mandolin" → ["Mandolin"]
- "banjo" → ["Banjo"]
- "ukulele" → ["Ukulele"]
- "harmonica" → ["Harmonica"]
- "vocal" → ["Lead Vocals", "Backing Vocals", "Harmony Vocals"]
- "vocals" → ["Lead Vocals", "Backing Vocals", "Harmony Vocals"]
- "singing" → ["Lead Vocals", "Backing Vocals", "Harmony Vocals"]
- "rap" → ["Rap"]
- "beatbox" → ["Beatboxing"]
- "beatboxing" → ["Beatboxing"]
- "electronic" → ["Synthesizer", "Drum Machine", "Sampler", "Sequencer"]
- "acoustic" → ["Acoustic Guitar", "Piano", "Violin", "Cello", "Harp", "Flute", "Clarinet"]
- "orchestral" → ["Violin", "Viola", "Cello", "Double Bass", "Trumpet", "Trombone", "French Horn", "Tuba", "Flute", "Clarinet", "Oboe", "Bassoon"]
- "percussion" → ["Drums", "Congas", "Bongos", "Djembe", "Tambourine", "Triangle", "Maracas", "Cowbell", "Timpani", "Xylophone", "Vibraphone", "Marimba", "Glockenspiel"]

Genre Synonyms:
- "jaz" → ["jazz"]
- "hip" → ["hip-hop", "hip hop"]
- "rap" → ["hip-hop", "rap"]
- "rock" → ["rock"]
- "pop" → ["pop"]
- "class" → ["classical"]
- "elect" → ["electronic"]
- "amb" → ["ambient"]
- "folk" → ["folk"]
- "count" → ["country"]
- "blues" → ["blues"]
- "regg" → ["reggae"]
- "funk" → ["funk"]
- "soul" → ["soul", "r&b"]
- "r&b" → ["r&b", "soul"]
- "rnb" → ["r&b", "soul"]
- "trap" → ["trap"]
- "edm" → ["electronic"]
- "dance" → ["electronic", "dance"]
- "orchestr" → ["classical"]
- "orchest" → ["classical"]
- "pian" → ["classical"]
- "violin" → ["classical"]
- "acoust" → ["acoustic"]
- "acousti" → ["acoustic"]

3. ALGOLIA SEARCH PARAMETERS:
Make sure your search includes:
- naturalLanguages: ['en']
- synonyms: true
- queryType: 'prefixAll'

4. INDEX SETTINGS:
- Enable "Natural Language Processing"
- Set "Query Type" to "prefixAll"
- Enable "Synonyms"
- Set "Searchable Attributes" in the order listed above
*/
