// Line icons from lucide (ISC licence, https://lucide.dev), inlined so the site
// needs no icon package. One size (16px) and one stroke (1.5) everywhere; the
// icon takes the colour of the text around it.
const PATHS = {
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  arrowUpRight: ['M7 7h10v10', 'M7 17 17 7'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, label }: { name: IconName; label?: string }) {
  return (
    <svg
      className="icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
