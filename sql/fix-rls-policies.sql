-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;

-- Create a function that safely checks if a user is an admin without using RLS
CREATE OR REPLACE FUNCTION public.check_if_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct query that bypasses RLS
  RETURN (SELECT is_admin FROM profiles WHERE id = user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simpler policies that won't cause recursion
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (id = auth.uid());

-- Create a policy for orders table to avoid recursion
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" 
ON orders FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
));
