ALTER TABLE white_label_clients
ADD CONSTRAINT white_label_clients_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES profiles(id); 