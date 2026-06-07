"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { ImageUpload, uploadImage } from "@/components/admin/image-upload"
import { Loader2, Plus, Pencil, Trash2, Package } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category_id: string
  stock: number
  featured: boolean
  created_at: string
  slug?: string
  categories?: {
    name: string
  }
}

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category_id: "",
    stock: 0,
    featured: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.from("categories").select("id, name").order("name", { ascending: true })

      if (error) throw error

      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false })

      if (error) throw error

      console.log("Fetched products:", data)
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "price" ? value : value,
    })
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      featured: checked,
    })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      image_url: "",
      category_id: "",
      stock: 0,
      featured: false,
    })
    setImageFile(null)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
  }

  const handleAddProduct = async () => {
    // Validate form data
    if (!formData.name || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Product name and price are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const supabase = await createClient()

      // Generate a slug from the name
      const slug = generateSlug(formData.name)

      // Upload the chosen image only now, on save.
      let imageUrl = formData.image_url
      if (imageFile) {
        imageUrl = await uploadImage("product-images", imageFile)
      }

      console.log("Adding product with data:", {
        name: formData.name,
        slug,
        description: formData.description,
        price: Number(formData.price),
        image_url: imageUrl,
        category_id: formData.category_id || null,
        stock: formData.stock,
        featured: formData.featured,
      })

      // Try direct insert first
      const { data: directData, error: directError } = await supabase
        .from("products")
        .insert({
          name: formData.name,
          slug: slug,
          description: formData.description,
          price: Number(formData.price),
          image_url: imageUrl,
          category_id: formData.category_id || null,
          stock: formData.stock,
          featured: formData.featured,
        })
        .select()

      if (!directError && directData) {
        console.log("Product created directly:", directData)

        // Refresh products list
        await fetchProducts()

        // Close dialog and reset form
        setIsAddDialogOpen(false)
        resetForm()

        toast({
          title: "Success",
          description: "Product added successfully",
          duration: 5000,
        })
        return
      }

      // If direct insert fails, try RPC
      if (directError) {
        console.warn("Direct insert failed, trying RPC:", directError)

        const { data, error } = await supabase.rpc("admin_insert_product", {
          product_name: formData.name,
          product_slug: slug,
          product_description: formData.description,
          product_price: Number(formData.price),
          product_image_url: imageUrl,
          product_category_id: formData.category_id || null,
          product_stock: formData.stock,
          product_featured: formData.featured,
        })

        if (error) {
          console.error("RPC Error:", error)
          throw error
        }

        if (data === null) {
          throw new Error("Failed to create product. No ID returned.")
        }

        console.log("Product created with ID:", data)

        // Refresh products list
        await fetchProducts()

        // Close dialog and reset form
        setIsAddDialogOpen(false)
        resetForm()

        toast({
          title: "Success",
          description: "Product added successfully via RPC",
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add product. Please try again.",
        variant: "destructive",
        duration: 7000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!currentProduct) return

    // Validate form data
    if (!formData.name || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Product name and price are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const supabase = await createClient()

      // Generate a slug from the name if name changed
      let slug = currentProduct.slug || generateSlug(currentProduct.name)
      if (formData.name !== currentProduct.name) {
        slug = generateSlug(formData.name)
      }

      // Upload the chosen image only now, on save.
      let imageUrl = formData.image_url
      if (imageFile) {
        imageUrl = await uploadImage("product-images", imageFile)
      }

      console.log("Updating product with data:", {
        id: currentProduct.id,
        name: formData.name,
        slug,
        description: formData.description,
        price: Number(formData.price),
        image_url: imageUrl,
        category_id: formData.category_id || null,
        stock: formData.stock,
        featured: formData.featured,
      })

      // Try direct update first
      const { error: directError } = await supabase
        .from("products")
        .update({
          name: formData.name,
          slug: slug,
          description: formData.description,
          price: Number(formData.price),
          image_url: imageUrl,
          category_id: formData.category_id || null,
          stock: formData.stock,
          featured: formData.featured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentProduct.id)

      if (!directError) {
        console.log("Product updated directly")

        // Refresh products list
        await fetchProducts()

        // Close dialog and reset
        setIsEditDialogOpen(false)
        setCurrentProduct(null)
        resetForm()

        toast({
          title: "Success",
          description: "Product updated successfully",
          duration: 5000,
        })
        return
      }

      // If direct update fails, try RPC
      if (directError) {
        console.warn("Direct update failed, trying RPC:", directError)

        const { data, error } = await supabase.rpc("admin_update_product", {
          product_id: currentProduct.id,
          product_name: formData.name,
          product_slug: slug,
          product_description: formData.description,
          product_price: Number(formData.price),
          product_image_url: imageUrl,
          product_category_id: formData.category_id || null,
          product_stock: formData.stock,
          product_featured: formData.featured,
        })

        if (error) {
          console.error("RPC Error:", error)
          throw error
        }

        console.log("Update result:", data)

        if (data === false) {
          throw new Error("Failed to update product. No rows affected.")
        }

        // Refresh products list
        await fetchProducts()

        // Close dialog and reset
        setIsEditDialogOpen(false)
        setCurrentProduct(null)
        resetForm()

        toast({
          title: "Success",
          description: "Product updated successfully via RPC",
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update product. Please try again.",
        variant: "destructive",
        duration: 7000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!currentProduct) return

    try {
      setIsSubmitting(true)
      const supabase = await createClient()

      console.log("Deleting product with ID:", currentProduct.id)

      // Try direct delete first
      const { error: directError } = await supabase.from("products").delete().eq("id", currentProduct.id)

      if (!directError) {
        console.log("Product deleted directly")

        // Refresh products list
        await fetchProducts()

        // Close dialog and reset
        setIsDeleteDialogOpen(false)
        setCurrentProduct(null)

        toast({
          title: "Success",
          description: "Product deleted successfully",
          duration: 5000,
        })
        return
      }

      // If direct delete fails, try RPC
      if (directError) {
        console.warn("Direct delete failed, trying RPC:", directError)

        const { data, error } = await supabase.rpc("admin_delete_product", {
          product_id: currentProduct.id,
        })

        if (error) {
          console.error("RPC Error:", error)
          throw error
        }

        console.log("Delete result:", data)

        if (data === false) {
          throw new Error("Failed to delete product. No rows affected.")
        }

        // Refresh products list
        await fetchProducts()

        // Close dialog and reset
        setIsDeleteDialogOpen(false)
        setCurrentProduct(null)

        toast({
          title: "Success",
          description: "Product deleted successfully via RPC",
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete product. Please try again.",
        variant: "destructive",
        duration: 7000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (product: Product) => {
    setCurrentProduct(product)
    setImageFile(null)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      stock: product.stock,
      featured: product.featured,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (product: Product) => {
    setCurrentProduct(product)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Products</h2>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">You haven't added any products yet.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative h-10 w-10">
                      <Image
                        src={product.image_url || "/placeholder.svg?height=40&width=40"}
                        alt={product.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.categories?.name || "Uncategorized"}</TableCell>
                  <TableCell>GH₵{product.price.toLocaleString()}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    {product.stock > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100">
                        Out of Stock
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => openDeleteDialog(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Fill in the details to add a new product to your inventory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (GH₵) *
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category_id" className="text-right">
                Category
              </Label>
              <select
                title="Category"
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Image</Label>
              <div className="col-span-3">
                <ImageUpload
                  value={formData.image_url}
                  file={imageFile}
                  onFileChange={setImageFile}
                  onValueChange={(url) => setFormData({ ...formData, image_url: url })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="featured" className="text-right">
                Featured
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="featured" checked={formData.featured} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="featured">{formData.featured ? "Yes" : "No"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setCurrentProduct(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the details of this product.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price (GH₵) *
              </Label>
              <Input
                id="edit-price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category_id" className="text-right">
                Category
              </Label>
              <select
                title="Category"
                id="edit-category_id"
                name="category_id"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Image</Label>
              <div className="col-span-3">
                <ImageUpload
                  value={formData.image_url}
                  file={imageFile}
                  onFileChange={setImageFile}
                  onValueChange={(url) => setFormData({ ...formData, image_url: url })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-stock" className="text-right">
                Stock
              </Label>
              <Input
                id="edit-stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-featured" className="text-right">
                Featured
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="edit-featured" checked={formData.featured} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="edit-featured">{formData.featured ? "Yes" : "No"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setCurrentProduct(null)
                resetForm()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditProduct} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) setCurrentProduct(null)
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{currentProduct?.name}</p>
            <p className="text-sm text-muted-foreground mt-1">Price: GH₵{currentProduct?.price?.toLocaleString()}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setCurrentProduct(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
