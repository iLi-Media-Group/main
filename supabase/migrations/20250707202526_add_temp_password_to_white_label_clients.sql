-- Add temp_password column to white_label_clients
ALTER TABLE white_label_clients
ADD COLUMN temp_password text NULL;
