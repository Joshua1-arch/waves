export function AdminFooter() {
  return (
    <footer className="mt-auto bg-brand-black text-brand-white">
      <div className="px-8 py-12 lg:pl-72">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-serif text-2xl text-brand-gold">WAVE & CO.</p>
            <p className="mt-4 max-w-sm text-sm text-brand-white/70">
              Defining the architectural vision of eyewear. Admin portal for
              internal operations and logistics management.
            </p>
          </div>
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-widest text-brand-gold">
              System
            </p>
            <ul className="space-y-2 text-sm text-brand-white/70">
              <li>Server Status</li>
              <li>API Docs</li>
              <li>User Logs</li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-widest text-brand-gold">
              Support
            </p>
            <ul className="space-y-2 text-sm text-brand-white/70">
              <li>Help Center</li>
              <li>Internal Privacy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-brand-white/10 pt-6 text-[10px] uppercase tracking-widest text-brand-white/40">
          © 2024 Wave & Co. Architectural Eyewear
        </p>
      </div>
    </footer>
  );
}
