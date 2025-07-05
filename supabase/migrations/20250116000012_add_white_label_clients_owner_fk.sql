-- Migration: Add foreign key constraint from white_label_clients.owner_id to profiles.id
ALTER TABLE white_label_clients
ADD CONSTRAINT fk_owner_id FOREIGN KEY (owner_id) REFERENCES profiles(id); 