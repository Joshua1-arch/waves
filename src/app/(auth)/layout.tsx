export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-cream">
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full border border-brand-black/5" />
      <div className="pointer-events-none absolute -right-24 top-12 h-[28rem] w-[28rem] rounded-full border border-brand-black/5" />
      {children}
    </div>
  );
}
