"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendApplicationMessageAction } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { getApplicationThread } from "@/lib/application-thread";

const time = new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" });

export function ApplicationThread({ applicationId, path, thread, olderView }: {
  applicationId: string;
  path: string;
  thread: NonNullable<Awaited<ReturnType<typeof getApplicationThread>>>;
  olderView: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const requestId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !draft && !pending) router.refresh();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [router, draft, pending]);

  return <section aria-labelledby="thread-title" className="grid gap-4 rounded-2xl border bg-card p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="thread-title" className="text-lg font-semibold">Private conversation</h2>
      <Button type="button" size="sm" variant="outline" onClick={() => router.refresh()}>Refresh messages</Button>
    </div>
    <div className="flex gap-4">
      {thread.older && <Link className="text-primary underline" href={`${path}?before=${thread.older}`} scroll={false}>Older messages</Link>}
      {olderView && <Link className="text-primary underline" href={path} scroll={false}>Latest messages</Link>}
    </div>
    {thread.messages.length ? <ol className="grid gap-2">
      {thread.messages.map((message) => <li key={message.id} className="rounded-xl border bg-background p-3">
        <div className="flex flex-wrap gap-2 text-sm"><strong>{message.senderRole}</strong><time className="text-muted-foreground" dateTime={message.createdAt}>{time.format(new Date(message.createdAt))}</time></div>
        <p className="mt-1 whitespace-pre-wrap text-sm">{message.text}</p>
      </li>)}
    </ol> : <p className="text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>}
    <form className="grid gap-2" onSubmit={async (event) => {
      event.preventDefault();
      if (pending || !draft.trim()) return;
      requestId.current ??= crypto.randomUUID();
      setPending(true);
      setError("");
      try {
        const result = await sendApplicationMessageAction(applicationId, draft, requestId.current);
        if (!result.ok) { setError(result.error ?? "The message could not be sent."); return; }
        setDraft("");
        requestId.current = undefined;
        if (olderView) router.replace(path, { scroll: false });
        else router.refresh();
      } catch {
        setError("The message could not be sent. Try again.");
      } finally {
        setPending(false);
      }
    }}>
      <label className="text-sm font-medium" htmlFor="thread-message">Message</label>
      <Textarea id="thread-message" value={draft} onChange={(event) => { setDraft(event.target.value); requestId.current = undefined; }} disabled={pending} required maxLength={2000} rows={4} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="justify-self-start" disabled={pending || !draft.trim()}>{pending ? "Sending…" : "Send message"}</Button>
    </form>
  </section>;
}
