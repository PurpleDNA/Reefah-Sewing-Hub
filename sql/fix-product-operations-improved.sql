-- Drop existing functions to recreate them with proper permissions
DROP FUNCTION IF EXISTS public.admin_delete_product(UUID);
DROP FUNCTION IF EXISTS public.admin_update_product(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, UUID, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS public.admin_insert_product(TEXT, TEXT, TEXT, NUMERIC, TEXT, UUID, INTEGER, BOOLEAN);

-- Create an improved function to safely delete products
CREATE OR REPLACE FUNCTION public.admin_delete_product(product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  DELETE FROM products WHERE id = product_id;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in admin_delete_product: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an improved function to safely update products
CREATE OR REPLACE FUNCTION public.admin_update_product(
  product_id UUID,
  product_name TEXT,
  product_slug TEXT,
  product_description TEXT,
  product_price NUMERIC,
  product_image_url TEXT,
  product_category_id UUID,
  product_stock INTEGER,
  product_featured BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE products
  SET 
    name = product_name,
    slug = product_slug,
    description = product_description,
    price = product_price,
    image_url = product_image_url,
    category_id = product_category_id,
    stock = product_stock,
    featured = product_featured,
    updated_at = NOW()
  WHERE id = product_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in admin_update_product: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an improved function to safely insert products
CREATE OR REPLACE FUNCTION public.admin_insert_product(
  product_name TEXT,
  product_slug TEXT,
  product_description TEXT,
  product_price NUMERIC,
  product_image_url TEXT,
  product_category_id UUID,
  product_stock INTEGER,
  product_featured BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO products (
    name,
    slug,
    description,
    price,
    image_url,
    category_id,
    stock,
    featured
  ) VALUES (
    product_name,
    product_slug,
    product_description,
    product_price,
    product_image_url,
    product_category_id,
    product_stock,
    product_featured
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in admin_insert_product: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_delete_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_product(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_insert_product(TEXT, TEXT, TEXT, NUMERIC, TEXT, UUID, INTEGER, BOOLEAN) TO authenticated;

-- Ensure RLS is not blocking these operations
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows admins to do anything with products
DROP POLICY IF EXISTS "Admin users can manage products" ON products;
CREATE POLICY "Admin users can manage products" ON products
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create a policy that allows all users to view products
DROP POLICY IF EXISTS "Everyone can view products" ON products;
CREATE POLICY "Everyone can view products" ON products
FOR SELECT USING (true);
