import { useEffect, useState } from "react";
import { getRequestAttachments, type RequestAttachment } from "@/lib/market";
import { signedUrl } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";

/** Google Drive link shared by the student. Only Google Drive / Docs links ever reach here. */
export function DriveLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rule bg-surface px-3 text-[14px] font-medium hover:border-muted">
      <Icon name="External" size={16} className="text-pen" /> Open Google Drive link
    </a>
  );
}

function FileButton({ f }: { f: RequestAttachment }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const open = async () => {
    setBusy(true); setFailed(false);
    const win = window.open("about:blank", "_blank"); // opened right away so the browser doesn't block it
    const url = await signedUrl("request-files", f.path);
    setBusy(false);
    if (url && win) { win.opener = null; win.location.href = url; }
    else { win?.close(); setFailed(true); }
  };
  return (
    <li className="flex items-center gap-3 py-1.5">
      <Icon name="FileText" size={18} className="text-muted" />
      <span className="min-w-0 flex-1 truncate text-[14px]">{f.name}<span className="num ml-2 text-[12px] text-muted">{(f.size / 1048576).toFixed(1)} MB</span></span>
      <button type="button" onClick={open} disabled={busy} className="min-h-11 rounded-md px-3 text-[14px] font-medium text-pen hover:bg-pen-soft">{busy ? "Opening…" : failed ? "Try again" : "Open"}</button>
    </li>
  );
}

/** Files + Drive link of a request. `auto` loads right away; otherwise a button loads them on demand (keeps long lists light). */
export function RequestAttachments({ requestId, auto = false, knownLink }: { requestId: string; auto?: boolean; knownLink?: string | null }) {
  const [data, setData] = useState<{ files: RequestAttachment[]; link: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const load = () => { setLoading(true); void getRequestAttachments(requestId).then((d) => { setData(d); setLoading(false); }); };
  useEffect(() => { if (auto) load(); }, [requestId, auto]); // eslint-disable-line react-hooks/exhaustive-deps

  const link = data?.link ?? knownLink ?? null;
  return (
    <div className="mt-3 space-y-2">
      {link && <DriveLink href={link} />}
      {!data ? (
        !auto && <button type="button" onClick={load} disabled={loading} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-pen hover:underline underline-offset-4"><Icon name="FileText" size={16} />{loading ? "Loading files…" : "See attached files"}</button>
      ) : data.files.length > 0 ? (
        <ul className="divide-y divide-rule rounded-xl border border-rule px-3" aria-label="Attached files">{data.files.map((f) => <FileButton key={f.path} f={f} />)}</ul>
      ) : (
        !link && <p className="text-[14px] text-muted">No files attached. Ask the student on chat.</p>
      )}
    </div>
  );
}
