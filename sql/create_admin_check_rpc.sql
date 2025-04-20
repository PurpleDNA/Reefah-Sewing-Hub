-- Create a simple RPC function to check admin status
CREATE OR REPLACE FUNCTION public.check_if_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_status BOOLEAN;
BEGIN
  -- Direct query to avoid recursion
  SELECT is_admin INTO is_admin_status FROM profiles WHERE id = user_id;
  RETURN COALESCE(is_admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
