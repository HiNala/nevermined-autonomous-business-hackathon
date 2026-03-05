import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative border-t py-10 px-6" style={{ borderColor: "var(--border-default)" }}>
      {/* Top glow line */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.15), transparent)" }}
      />

      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-5 items-center justify-center">
            <span className="absolute size-5 rounded border border-white/10 rotate-45" />
            <span className="size-1 rounded-full bg-[var(--green-500)]" />
          </div>
          <span className="font-mono text-[11px] tracking-widest" style={{ color: "var(--gray-400)" }}>
            {SITE_NAME}
          </span>
        </div>
        <div className="flex items-center gap-5">
          {[
            { label: "Nevermined", href: "https://nevermined.app" },
            { label: "Docs", href: "https://docs.nevermined.app" },
            { label: "GitHub", href: "https://github.com/HiNala/nevermined-autonomous-business-hackathon" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] transition-colors duration-200"
              style={{ color: "var(--gray-400)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green-400)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
