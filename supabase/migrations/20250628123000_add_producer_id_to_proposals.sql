ALTER TABLE public.sync_proposals
ADD COLUMN producer_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.licenses
ADD COLUMN producer_id UUID REFERENCES public.profiles(id);

CREATE INDEX ON public.sync_proposals (producer_id);
CREATE INDEX ON public.licenses (producer_id);