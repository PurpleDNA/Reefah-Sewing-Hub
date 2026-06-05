"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Upload, X, ImageIcon } from "lucide-react";

const MAX_SIZE_MB = 5;
const ACCEPTED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

/**
 * Uploads a file to a Supabase Storage bucket and returns its public URL.
 * Call this at form-submit time (not on file select) so the bucket only ever
 * receives images the admin actually saves.
 */
export async function uploadImage(
  bucket: string,
  file: File,
  folder?: string,
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

interface ImageUploadProps {
  /** Currently committed image URL (e.g. loaded from the DB). */
  value?: string;
  /** Pending file the admin has picked but not yet saved. */
  file?: File | null;
  /** Called when the admin picks a new file (or null when cleared). */
  onFileChange: (file: File | null) => void;
  /** Called to clear the committed URL (used by the remove button). */
  onValueChange: (url: string) => void;
  /** Disable interaction (e.g. while the parent form is submitting). */
  disabled?: boolean;
}

export function ImageUpload({
  value,
  file,
  onFileChange,
  onValueChange,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Build (and clean up) an object URL for the pending file's preview.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displaySrc = previewUrl || value || "";

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    // Reset so picking the same file again re-triggers onChange.
    e.target.value = "";
    if (!selected) return;

    if (!ACCEPTED.includes(selected.type)) {
      toast({
        title: "Unsupported file",
        description: "Please choose a JPEG, PNG, WebP, GIF, or AVIF image.",
        variant: "destructive",
      });
      return;
    }

    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Images must be smaller than ${MAX_SIZE_MB}MB.`,
        variant: "destructive",
      });
      return;
    }

    // Defer the actual upload to form submit — just hold the file for now.
    onFileChange(selected);
  };

  const handleRemove = () => {
    onFileChange(null);
    onValueChange("");
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={handleSelect}
        disabled={disabled}
      />

      {displaySrc ? (
        <div className="relative h-40 w-full overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc || "/placeholder.svg"}
            alt="Image preview"
            className="h-full w-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove image</span>
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImageIcon className="h-8 w-8" />
          <span className="text-sm">Click to choose an image</span>
          <span className="text-xs">JPEG, PNG, WebP up to {MAX_SIZE_MB}MB</span>
        </button>
      )}

      {displaySrc && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="mr-2 h-4 w-4" /> Choose a different image
        </Button>
      )}
    </div>
  );
}
