// Root layout that only passes children through. `[locale]/layout.tsx`
// renders `<html lang>` per locale, and `not-found.tsx` renders its own
// document. Next needs a root layout here because of the root not-found page
// (next-intl pattern for apps without middleware).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
