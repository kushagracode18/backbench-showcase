import { Icon, type IconName } from "@/components/ui/Icon";

/** Workflow diagram for "Syllabus to videos": upload → AI reads → YouTube search → playlist. */
type Step = { icon: IconName; title: string; body: string; visual: "file" | "topics" | "search" | "playlist" };
const steps: Step[] = [
  { icon: "Upload", title: "Upload your syllabus", body: "PDF, photo or pasted text — one subject at a time.", visual: "file" },
  { icon: "List", title: "AI reads the topics", body: "Every topic, in the same order, grouped by unit.", visual: "topics" },
  { icon: "Search", title: "We search YouTube", body: "2–3 good lectures per topic, English or Hindi. No Shorts.", visual: "search" },
  { icon: "Check", title: "Watch unit by unit", body: "Play a whole unit as one playlist before the exam.", visual: "playlist" },
];

function Visual({ kind }: { kind: Step["visual"] }) {
  const line = "h-1.5 rounded-full bg-ink/15";
  if (kind === "file")
    return (
      <div className="mx-auto w-[92px] rounded-lg border border-rule bg-surface p-2.5 shadow-soft">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-report">Syllabus.pdf</p>
        <div className="space-y-1.5"><div className={`${line} w-full`} /><div className={`${line} w-4/5`} /><div className={`${line} w-full`} /><div className={`${line} w-3/5`} /></div>
      </div>
    );
  if (kind === "topics")
    return (
      <ul className="mx-auto w-[150px] space-y-1 text-left text-[11px] leading-tight">
        {["Unit 1 · Arrays", "1.2 Linked lists", "Unit 2 · Sorting"].map((t, i) => (
          <li key={t} className={`rounded-md border border-rule bg-surface px-2 py-1 shadow-soft ${i === 1 ? "ml-3" : ""}`}><span className="num text-muted">{i === 1 ? "↳ " : ""}</span>{t}</li>
        ))}
      </ul>
    );
  if (kind === "search")
    return (
      <div className="mx-auto grid w-[150px] grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative aspect-video rounded-md bg-linear-to-br from-report/25 to-pen/20">
            <span className="absolute inset-0 m-auto grid size-4 place-items-center rounded-full bg-surface/90 text-[7px] text-ink">▶</span>
          </div>
        ))}
      </div>
    );
  return (
    <div className="mx-auto w-[150px] rounded-lg border border-rule bg-surface p-2 text-left shadow-soft">
      <p className="mb-1 text-[10px] font-semibold text-ink">Unit 1 playlist</p>
      {["Arrays", "Linked lists", "Stacks"].map((t, i) => (
        <p key={t} className="flex items-center gap-1.5 py-0.5 text-[10px] text-ink/80"><span className="num text-muted">{i + 1}</span><span className="h-2.5 w-4 rounded-sm bg-report/40" />{t}</p>
      ))}
    </div>
  );
}

export function SyllabusFlow({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <ol className="grid gap-4 md:grid-cols-4 md:gap-5" aria-label="How Syllabus to videos works">
        {steps.map((s, i) => (
          <li key={s.title} className="relative">
            <div className="flex h-full flex-col rounded-[20px] border border-rule bg-surface/80 p-5 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-report-soft text-report"><Icon name={s.icon} size={17} /></span>
                <span className="num text-[12px] font-medium text-muted">STEP {i + 1}</span>
              </div>
              <div className="my-5 flex min-h-[96px] items-center" aria-hidden="true"><Visual kind={s.visual} /></div>
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 text-[14px] text-muted">{s.body}</p>
            </div>
            {i < steps.length - 1 && (
              <>
                {/* desktop: arrow between cards */}
                <span aria-hidden="true" className="absolute -right-[19px] top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-rule bg-paper text-report shadow-soft md:grid">
                  <Icon name="ArrowRight" size={15} />
                </span>
                {/* mobile: connector below the card */}
                <span aria-hidden="true" className="mx-auto mt-1 -mb-3 flex h-6 w-px bg-report/40 md:hidden" />
              </>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">Upload your syllabus, AI lists the topics in order, we find YouTube lectures for each topic, and you watch unit by unit.</figcaption>
    </figure>
  );
}
