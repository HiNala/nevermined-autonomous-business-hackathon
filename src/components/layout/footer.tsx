import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Studio", href: "/studio" },
  { label: "Research", href: "/research" },
  { label: "Services", href: "/services" },
  { label: "Agents", href: "/agents" },
];

const RESOURCE_LINKS = [
  { label: "Nevermined", href: "https://nevermined.app", external: true },
  { label: "Documentation", href: "https://docs.nevermined.app", external: true },
  { label: "GitHub", href: "https://github.com/HiNala/nevermined-autonomous-business-hackathon", external: true },
];

const STATUS_LINKS = [
  { label: "Open Studio", href: "/studio", external: false },
  { label: "Agent API", href: "/.well-known/agent.json", external: true },
  { label: "GitHub", href: "https://github.com/HiNala/nevermined-autonomous-business-hackathon", external: true },
];

function FooterLink({ label, href, external }: { label: string; href: string; external?: boolean }) {
  const cls = "text-[12px] transition-colors duration-200";
  const style: React.CSSProperties = { color: "var(--gray-400)" };

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        style={style}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green-400)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={cls}
      style={style}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green-400)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
    >
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t px-6 pt-14 pb-8" style={{ borderColor: "var(--border-default)" }}>
      {/* Top glow line */}
      <div
        className="absolute top-0 left-[15%] right-[15%] h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.18), transparent)" }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="relative flex size-5 items-center justify-center">
                <span className="absolute size-5 rounded border border-white/10 rotate-45" />
                <span className="size-1 rounded-full" style={{ background: "var(--green-500)" }} />
              </div>
              <span className="font-mono text-[12px] font-semibold tracking-widest" style={{ color: "var(--gray-800)" }}>
                {SITE_NAME}
              </span>
            </div>
            <p className="max-w-[200px] text-[12px] leading-relaxed" style={{ color: "var(--gray-400)" }}>
              A specialized agent studio for research, planning, and front-end design.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-500)" }}>
              Product
            </p>
            <div className="flex flex-col gap-2.5">
              {NAV_LINKS.map((l) => (
                <FooterLink key={l.label} label={l.label} href={l.href} />
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-500)" }}>
              Resources
            </p>
            <div className="flex flex-col gap-2.5">
              {RESOURCE_LINKS.map((l) => (
                <FooterLink key={l.label} label={l.label} href={l.href} external={l.external} />
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-500)" }}>
              Quick Links
            </p>
            <div className="flex flex-col gap-2.5">
              {STATUS_LINKS.map((l) => (
                <FooterLink key={l.label} label={l.label} href={l.href} external={l.external} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between border-t pt-6"
          style={{ borderColor: "var(--border-default)" }}
        >
          <p className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
            &copy; {new Date().getFullYear()} Auto Business. Powered by Nevermined.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full opacity-50" style={{ background: "var(--green-400)" }} />
              <span className="relative inline-flex size-1.5 rounded-full" style={{ background: "var(--green-500)" }} />
            </span>
            <span className="font-mono text-[10px]" style={{ color: "var(--green-400)" }}>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
