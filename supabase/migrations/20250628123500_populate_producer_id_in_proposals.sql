UPDATE public.sync_proposals sp
SET producer_id = t.producer_id
FROM public.tracks t
WHERE sp.track_id = t.id;

UPDATE public.licenses l
SET producer_id = t.producer_id
FROM public.tracks t
WHERE l.track_id = t.id;