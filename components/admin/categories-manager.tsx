"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { ImageUpload, uploadImage } from "@/components/admin/image-upload";
import { Loader2, Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import type { Category } from "@/types";

interface CategoriesManagerProps {
  initialCategories: Category[];
}

const emptyForm = { name: "", slug: "", image_url: "" };

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

export function CategoriesManager({
  initialCategories,
}: CategoriesManagerProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<Category | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData(emptyForm);
    setImageFile(null);
    setSlugEdited(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-fill the slug from the name until the user edits the slug manually.
      slug: slugEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugEdited(true);
    setFormData((prev) => ({ ...prev, slug: e.target.value }));
  };

  const refresh = () => router.refresh();

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const supabase = createClient();

      // Upload the chosen image only now, on save.
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage("category-images", imageFile);
      }

      const { error } = await supabase.from("categories").insert({
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        image_url: imageUrl || null,
      });
      if (error) throw error;

      setIsAddOpen(false);
      resetForm();
      refresh();
      toast({
        title: "Category created",
        description: "The category was added successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to add category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!current) return;
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const supabase = createClient();

      // Upload the chosen image only now, on save.
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage("category-images", imageFile);
      }

      const { error } = await supabase
        .from("categories")
        .update({
          name: formData.name.trim(),
          slug: formData.slug.trim() || generateSlug(formData.name),
          image_url: imageUrl || null,
        })
        .eq("id", current.id);
      if (error) throw error;

      setIsEditOpen(false);
      setCurrent(null);
      resetForm();
      refresh();
      toast({
        title: "Category updated",
        description: "The category was updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!current) return;
    try {
      setIsSubmitting(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", current.id);
      if (error) throw error;

      setIsDeleteOpen(false);
      setCurrent(null);
      refresh();
      toast({
        title: "Category deleted",
        description: "The category was removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (category: Category) => {
    setCurrent(category);
    setImageFile(null);
    setFormData({
      name: category.name,
      slug: category.slug,
      image_url: category.image_url || "",
    });
    setSlugEdited(true);
    setIsEditOpen(true);
  };

  const openDelete = (category: Category) => {
    setCurrent(category);
    setIsDeleteOpen(true);
  };

  const renderFields = (idPrefix: string) => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name *</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={handleNameChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-slug`}>Slug *</Label>
        <Input
          id={`${idPrefix}-slug`}
          value={formData.slug}
          onChange={handleSlugChange}
          required
        />
        <p className="text-xs text-muted-foreground">
          Used in URLs. Auto-generated from the name; edit if needed.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Image</Label>
        <ImageUpload
          value={formData.image_url}
          file={imageFile}
          onFileChange={setImageFile}
          onValueChange={(url) =>
            setFormData((prev) => ({ ...prev, image_url: url }))
          }
          disabled={isSubmitting}
        />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {initialCategories.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
          <FolderTree className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No categories yet</h3>
          <p className="text-muted-foreground">
            Create your first category to organize products.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                      {category.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={category.image_url || "/placeholder.svg"}
                          alt={category.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FolderTree className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => openDelete(category)}
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

      {/* Add dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new category to group your products.
            </DialogDescription>
          </DialogHeader>
          {renderFields("add")}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setCurrent(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the details of this category.
            </DialogDescription>
          </DialogHeader>
          {renderFields("edit")}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
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

      {/* Delete dialog */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setCurrent(null);
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? Products in it will
              become uncategorized. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{current?.name}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
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
  );
}
