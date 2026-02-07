import React, { useMemo } from "react";
import { ExternalLink, MapPin } from "lucide-react";

function normalizeUrl(url) {
  return String(url || "").trim().replace(/[),.;!?]+$/, "");
}

function parseDetailLine(line) {
  const text = String(line || "")
    .replace(/^[•*-]\s*/, "")
    .trim();

  if (!text) return null;

  const mapMatch = text.match(/^Google\s*Maps:\s*(https?:\/\/\S+)/i);
  if (mapMatch) {
    const url = normalizeUrl(mapMatch[1]);
    return {
      type: "map",
      label: "Google Maps",
      value: url,
      href: url,
    };
  }

  const withLabel = text.match(/^([^:]{1,40}):\s*(.+)$/);
  if (withLabel) {
    return {
      type: "labeled",
      label: withLabel[1].trim(),
      value: withLabel[2].trim(),
    };
  }

  return {
    type: "text",
    label: "",
    value: text,
  };
}

function parseLiveResponse(text) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const intro = [];
  const sections = [];
  let currentSection = null;
  let currentItem = null;

  const pushSection = () => {
    if (!currentSection) return;
    if (currentItem) {
      currentSection.items.push(currentItem);
      currentItem = null;
    }
    sections.push(currentSection);
    currentSection = null;
  };

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = {
        title: "Response",
        items: [],
        notes: [],
      };
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      if (currentSection && currentItem) {
        currentSection.items.push(currentItem);
        currentItem = null;
      }
      continue;
    }

    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      pushSection();
      currentSection = {
        title: heading[1].trim(),
        items: [],
        notes: [],
      };
      continue;
    }

    const itemMatch = line.match(/^\*\*(.+?)\*\*\s*(?:📍)?\s*$/);
    if (itemMatch) {
      ensureSection();
      if (currentItem) {
        currentSection.items.push(currentItem);
      }
      currentItem = {
        name: itemMatch[1].trim(),
        details: [],
      };
      continue;
    }

    if (/^[•*-]\s+/.test(line)) {
      const detail = parseDetailLine(line);
      if (!detail) continue;
      ensureSection();
      if (!currentItem) {
        currentItem = {
          name: "Details",
          details: [],
        };
      }
      currentItem.details.push(detail);
      continue;
    }

    if (!currentSection) {
      intro.push(line);
      continue;
    }

    ensureSection();
    if (currentItem) {
      currentItem.details.push({
        type: "text",
        label: "",
        value: line,
      });
    } else {
      currentSection.notes.push(line);
    }
  }

  pushSection();

  return {
    intro,
    sections,
  };
}

function LinkText({ text, className = "" }) {
  const value = String(text || "");
  const parts = value.split(/(https?:\/\/\S+)/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (!/^https?:\/\/\S+$/i.test(part)) {
          return (
            <span key={`${part}-${idx}`} className={className}>
              {part}
            </span>
          );
        }

        const href = normalizeUrl(part);
        return (
          <a
            key={`${href}-${idx}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#0b5b57] underline underline-offset-2 hover:text-[#084744]"
          >
            {href}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      })}
    </>
  );
}

export default function LiveResponseRenderer({
  text = "",
  compact = false,
  className = "",
}) {
  const parsed = useMemo(() => parseLiveResponse(text), [text]);

  if (!String(text || "").trim()) return null;

  return (
    <div
      className={[
        "space-y-3",
        compact ? "text-[12px]" : "text-[13px]",
        className,
      ].join(" ")}
    >
      {parsed.intro.length ? (
        <div className="rounded-2xl border border-[#e3d7c3] bg-white px-4 py-3">
          {parsed.intro.map((line, index) => (
            <p
              key={`intro-${index}`}
              className={[
                "leading-relaxed text-[#314c58]",
                index > 0 ? "mt-2" : "",
              ].join(" ")}
            >
              <LinkText text={line} />
            </p>
          ))}
        </div>
      ) : null}

      {parsed.sections.map((section, sectionIndex) => (
        <section
          key={`${section.title}-${sectionIndex}`}
          className="rounded-2xl border border-[#e3d7c3] bg-[#fffaf2] px-4 py-3"
        >
          <h4
            className={[
              "font-semibold text-[#223f4a]",
              compact ? "text-[12px]" : "text-[14px]",
            ].join(" ")}
          >
            {section.title}
          </h4>

          {section.notes.length ? (
            <div className="mt-2 space-y-1.5">
              {section.notes.map((note, noteIndex) => (
                <p
                  key={`note-${noteIndex}`}
                  className="leading-relaxed text-[#4c626b]"
                >
                  <LinkText text={note} />
                </p>
              ))}
            </div>
          ) : null}

          {section.items.length ? (
            <div className="mt-3 space-y-2.5">
              {section.items.map((item, itemIndex) => (
                <article
                  key={`${item.name}-${itemIndex}`}
                  className="rounded-[16px] border border-[#e7ddcc] bg-white px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e9f5ef] text-[#0b5b57]">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                    <h5 className="text-[13px] font-semibold text-[#264754]">
                      {item.name}
                    </h5>
                  </div>

                  {item.details.length ? (
                    <div className="mt-2 space-y-1.5">
                      {item.details.map((detail, detailIndex) => (
                        <div
                          key={`${item.name}-detail-${detailIndex}`}
                          className="leading-relaxed text-[#4f6670]"
                        >
                          {detail.type === "map" && detail.href ? (
                            <div className="inline-flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-[#36515d]">
                                {detail.label}:
                              </span>
                              <a
                                href={detail.href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-[#0b5b57] underline underline-offset-2 hover:text-[#084744]"
                              >
                                Open map
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ) : detail.type === "labeled" ? (
                            <span>
                              <span className="font-semibold text-[#36515d]">
                                {detail.label}:
                              </span>{" "}
                              <LinkText text={detail.value} />
                            </span>
                          ) : (
                            <LinkText text={detail.value} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
