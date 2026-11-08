"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumSize = 3 * 1024 * 1024;

export function ProfilePictureUploader({ avatarUrl, fullName, initials }: {
  avatarUrl?: string;
  fullName: string;
  initials: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function resetSelection() {
    setSelected(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectPicture(file?: File) {
    if (!file) return;
    if (!allowedTypes.has(file.type)) return toast.error("Choose a JPG, PNG, or WebP image.");
    if (file.size > maximumSize) return toast.error("The profile picture must be 3 MB or smaller.");
    setSelected(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadPicture() {
    if (!selected) return;
    setBusy("upload");
    try {
      const form = new FormData();
      form.set("file", selected);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      resetSelection();
      toast.success("Profile picture updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The profile picture could not be uploaded.");
    } finally {
      setBusy(null);
    }
  }

  async function removePicture() {
    if (!window.confirm("Remove your profile picture? Your initials will be shown instead.")) return;
    setBusy("remove");
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Removal failed.");
      toast.success("Profile picture removed.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The profile picture could not be removed.");
    } finally {
      setBusy(null);
    }
  }

  const picture = previewUrl ?? avatarUrl;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => selectPicture(event.target.files?.[0])}
      />
      <div className="relative mx-auto w-fit">
        <Avatar className="size-24 ring-4 ring-slate-100">
          {picture && <AvatarImage src={picture} alt={`${fullName}'s profile picture`} />}
          <AvatarFallback className="bg-muted text-2xl font-bold text-foreground">{initials}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          className="absolute -bottom-1 -right-1 grid size-11 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-md transition hover:bg-sidebar focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30 disabled:opacity-60 sm:size-9"
          aria-label={avatarUrl ? "Choose a new profile picture" : "Choose a profile picture"}
        >
          <Camera className="size-4" />
        </button>
      </div>

      <p className="mt-4 text-sm font-semibold text-foreground">Profile picture</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Optional · JPG, PNG, or WebP · Up to 3 MB</p>

      {selected ? (
        <div className="mt-4 grid gap-2">
          <Button type="button" onClick={uploadPicture} disabled={busy !== null} className="bg-primary text-primary-foreground hover:bg-sidebar">
            {busy === "upload" ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
            {busy === "upload" ? "Uploading…" : "Upload picture"}
          </Button>
          <Button type="button" variant="ghost" onClick={resetSelection} disabled={busy !== null}>Cancel</Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy !== null}>
            <Camera className="size-4" /> {avatarUrl ? "Change picture" : "Choose picture"}
          </Button>
          {avatarUrl && (
            <Button type="button" variant="ghost" onClick={removePicture} disabled={busy !== null} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
              {busy === "remove" ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {busy === "remove" ? "Removing…" : "Remove picture"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
