-- Create a function to create orders without triggering RLS policy recursion
CREATE OR REPLACE FUNCTION public.create_order(
  p_user_id UUID,
  p_total NUMERIC,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_state TEXT,
  p_postal_code TEXT,
  p_status TEXT
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
BEGIN
  INSERT INTO orders (
    user_id,
    total,
    first_name,
    last_name,
    email,
    phone,
    address,
    city,
    state,
    postal_code,
    status
  ) VALUES (
    p_user_id,
    p_total,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_address,
    p_city,
    p_state,
    p_postal_code,
    p_status
  )
  RETURNING id INTO v_order_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
