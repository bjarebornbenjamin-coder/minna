import { Fragment, type ReactNode } from "react";

/** Inline: **bold**, *italic*, `code` and plain links. Built as React elements, never as HTML strings. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const key = `${keyBase}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={key} className="font-semibold">{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={key} className="rounded bg-bg-2 px-1 py-0.5 text-[0.9em]">{t.slice(1, -1)}</code>);
    else if (t.startsWith("http"))
      out.push(
        <a key={key} href={t} target="_blank" rel="noreferrer noopener" className="link break-all">
          {t}
        </a>,
      );
    else out.push(<em key={key}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; text: string }
  | { kind: "h"; text: string };

function parse(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", text: buf.join("\n") });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      blocks.push({ kind: "h", text: h[1] });
      i++;
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*•]\s+/, ""));
      blocks.push({ kind: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push({ kind: "ol", items });
      continue;
    }
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !lines[i].trim().startsWith("```")
    )
      buf.push(lines[i++]);
    blocks.push({ kind: "p", lines: buf });
  }
  return blocks;
}

/** Renders the small Markdown subset the assistant uses */
export function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 leading-relaxed">
      {parse(text).map((b, bi) => {
        const k = `b${bi}`;
        switch (b.kind) {
          case "h":
            return (
              <p key={k} className="font-semibold">
                {inline(b.text, k)}
              </p>
            );
          case "ul":
            return (
              <ul key={k} className="ml-5 list-disc space-y-1 marker:text-ink-2">
                {b.items.map((it, ii) => (
                  <li key={ii}>{inline(it, `${k}-${ii}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={k} className="ml-5 list-decimal space-y-1 marker:text-ink-2">
                {b.items.map((it, ii) => (
                  <li key={ii}>{inline(it, `${k}-${ii}`)}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre key={k} className="overflow-x-auto rounded-md border border-line bg-surface p-3 text-sm">
                <code>{b.text}</code>
              </pre>
            );
          default:
            return (
              <p key={k}>
                {b.lines.map((l, li) => (
                  <Fragment key={li}>
                    {li > 0 && <br />}
                    {inline(l, `${k}-${li}`)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
