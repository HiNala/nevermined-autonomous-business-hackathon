import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer
      className="border-t py-8 px-6"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full"
            style={{ background: "var(--green-500)" }}
          />
          <span className="font-mono text-xs text-[var(--gray-400)]">
            {SITE_NAME}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://nevermined.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[var(--gray-400)] transition-colors hover:text-[var(--gray-600)]"
          >
            Nevermined
          </a>
          <a
            href="https://docs.nevermined.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[var(--gray-400)] transition-colors hover:text-[var(--gray-600)]"
          >
            Docs
          </a>
          <a
            href="https://github.com/HiNala/nevermined-autonomous-business-hackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[var(--gray-400)] transition-colors hover:text-[var(--gray-600)]"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
