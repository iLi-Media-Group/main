-- Create the missing get_next_producer_number function
CREATE OR REPLACE FUNCTION get_next_producer_number()
RETURNS TEXT AS $$
DECLARE
    next_number TEXT;
    max_number INTEGER := 0;
BEGIN
    -- Get the highest existing producer number
    SELECT COALESCE(MAX(CAST(SUBSTRING(producer_number FROM 6) AS INTEGER)), 0)
    INTO max_number
    FROM producer_invitations
    WHERE producer_number LIKE 'MBPR-%';
    
    -- Generate the next number
    next_number := 'MBPR-' || LPAD((max_number + 1)::TEXT, 2, '0');
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;









