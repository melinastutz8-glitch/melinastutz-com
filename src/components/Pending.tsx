// Marks content that Melina still has to supply. Visible on purpose, so it
// cannot ship unnoticed; remove every <Pending> before the site goes live
// (CLAUDE.md, "Content still missing").
export function Pending({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="pending">
      <span className="pending-label">{label}:</span> {children}
    </p>
  );
}
