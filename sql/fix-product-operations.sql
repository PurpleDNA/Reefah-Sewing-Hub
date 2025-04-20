-- Create a function to safely delete products without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.admin_delete_product(product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM products WHERE id = product_id;
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to safely update products without triggering RLS recursion
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
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to safely insert products without triggering RLS recursion
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
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
