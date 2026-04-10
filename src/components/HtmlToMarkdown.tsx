import { useState, useEffect } from "react";

// ── HTML → Markdown converter ────────────────────────────────────────────────

function nodeToMd(node: Node, listDepth = 0, listType: "ul" | "ol" | null = null, listIndex = { n: 1 }): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = () => Array.from(el.childNodes).map((c) => nodeToMd(c, listDepth, listType, listIndex)).join("");

  switch (tag) {
    case "h1": return `\n# ${children().trim()}\n`;
    case "h2": return `\n## ${children().trim()}\n`;
    case "h3": return `\n### ${children().trim()}\n`;
    case "h4": return `\n#### ${children().trim()}\n`;
    case "h5": return `\n##### ${children().trim()}\n`;
    case "h6": return `\n###### ${children().trim()}\n`;
    case "p":  return `\n${children().trim()}\n`;
    case "br": return "  \n";
    case "hr": return "\n---\n";
    case "strong":
    case "b":  return `**${children()}**`;
    case "em":
    case "i":  return `*${children()}*`;
    case "s":
    case "del":
    case "strike": return `~~${children()}~~`;
    case "code": {
      if (el.parentElement?.tagName.toLowerCase() === "pre") return children();
      return `\`${children()}\``;
    }
    case "pre": {
      const lang = (el.querySelector("code")?.className.match(/language-(\w+)/) ?? [])[1] ?? "";
      const content = el.querySelector("code")?.textContent ?? el.textContent ?? "";
      return `\n\`\`\`${lang}\n${content.trim()}\n\`\`\`\n`;
    }
    case "blockquote": {
      const inner = children().trim().split("\n").map((l) => `> ${l}`).join("\n");
      return `\n${inner}\n`;
    }
    case "a": {
      const href = el.getAttribute("href") ?? "";
      const title = el.getAttribute("title");
      const text = children().trim();
      return title ? `[${text}](${href} "${title}")` : `[${text}](${href})`;
    }
    case "img": {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      const title = el.getAttribute("title");
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
    }
    case "ul": {
      const items = Array.from(el.children).map((li) => {
        const text = nodeToMd(li, listDepth + 1, "ul", listIndex).trim();
        const indent = "  ".repeat(listDepth);
        return `${indent}- ${text}`;
      });
      return `\n${items.join("\n")}\n`;
    }
    case "ol": {
      const idx = { n: 1 };
      const items = Array.from(el.children).map((li) => {
        const text = nodeToMd(li, listDepth + 1, "ol", idx).trim();
        const indent = "  ".repeat(listDepth);
        const result = `${indent}${idx.n}. ${text}`;
        idx.n++;
        return result;
      });
      return `\n${items.join("\n")}\n`;
    }
    case "li": return children();
    case "table": {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (rows.length === 0) return "";
      const toRow = (tr: Element) => {
        const cells = Array.from(tr.querySelectorAll("td, th")).map((c) => (c.textContent ?? "").trim());
        return `| ${cells.join(" | ")} |`;
      };
      const header = toRow(rows[0]);
      const sep = `| ${Array.from(rows[0].querySelectorAll("td, th")).map(() => "---").join(" | ")} |`;
      const body = rows.slice(1).map(toRow).join("\n");
      return `\n${header}\n${sep}\n${body}\n`;
    }
    case "div":
    case "section":
    case "article":
    case "main":
    case "header":
    case "footer":
    case "aside":
    case "nav":
    case "span": return children();
    default: return children();
  }
}

function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  let md = Array.from(body.childNodes).map((n) => nodeToMd(n)).join("");
  // Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}


// ── Component ────────────────────────────────────────────────────────────────

export default function HtmlToMarkdown() {
  const [html, setHtml] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (!html.trim()) {
      setMarkdown("");
      return;
    }
    try {
      setMarkdown(htmlToMarkdown(html));
    } catch (e) {
      setError(`Conversion failed: ${(e as Error).message}`);
      setMarkdown("");
    }
  }, [html]);

  function handleClear() {
    setHtml("");
    setMarkdown("");
    setError(null);
  }

  function handleCopy() {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDownload() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markdown.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-3 bg-error-container/30 border border-error/20 rounded-xl">
          <span className="material-symbols-outlined text-error text-base shrink-0">error</span>
          <span className="text-error font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Dual Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant/15 rounded-2xl overflow-hidden shadow-2xl">
        {/* Left: HTML Input */}
        <div className="bg-surface-container-lowest dark:bg-inverse-surface/10 p-6 flex flex-col h-[560px]">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>html</span>
              Source HTML
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setHtml(text);
                  } catch {}
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-fixed hover:opacity-70 transition-opacity cursor-pointer"
              >
                <span className="material-symbols-outlined text-[1.1rem]">content_paste</span>
                Paste
              </button>
              <div className="w-px h-4 bg-outline-variant/50" />
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs font-semibold text-error hover:opacity-70 transition-opacity cursor-pointer"
              >
                <span className="material-symbols-outlined text-[1.1rem]">delete_sweep</span>
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={html}
            onChange={(e) => { setHtml(e.target.value); setError(null); }}
            placeholder={"<div class='header'>Paste your HTML here...</div>"}
            className="flex-grow w-full bg-surface-container dark:bg-inverse-surface/20 border-0 rounded-xl p-5 font-mono text-sm text-on-background resize-none focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-outline/40 transition-all"
          />
        </div>

        {/* Right: Markdown Output */}
        <div className="bg-surface-container-low dark:bg-inverse-surface/20 p-6 flex flex-col h-[560px]">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>segment</span>
              Markdown Output
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!markdown}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-fixed hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[1.1rem]">{copied ? "check" : "content_copy"}</span>
                {copied ? "Copied!" : "Copy"}
              </button>
              <div className="w-px h-4 bg-outline-variant/50" />
              <button
                onClick={handleDownload}
                disabled={!markdown}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-fixed hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[1.1rem]">download</span>
                Download
              </button>
            </div>
          </div>
          <textarea
            value={markdown}
            readOnly
            placeholder="# Waiting for input..."
            className="flex-grow w-full bg-surface-container-lowest dark:bg-inverse-surface/10 border border-outline-variant/20 rounded-xl p-5 font-mono text-sm text-primary dark:text-primary-fixed resize-none focus:ring-0 outline-none placeholder:text-outline/30"
          />
        </div>
      </div>

    </div>
  );
}
