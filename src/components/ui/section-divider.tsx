export function SectionDivider() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-2">
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--border-default) 20%, rgba(201, 125, 78, 0.15) 50%, var(--border-default) 80%, transparent 100%)",
        }}
      />
    </div>
  );
}
