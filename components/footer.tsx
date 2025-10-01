export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">♟</span>
            <p>
              © {new Date().getFullYear()} <span className="text-gray-200 font-medium">Schachzwerge Magdeburg e.V.</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="mailto:meldung@schachzwerge-magdeburg.de"
              className="hover:text-primary transition-colors duration-200"
            >
              Kontakt
            </a>
            <span className="text-zinc-700">•</span>
            <a
              href="https://schachzwerge-magdeburg.de"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors duration-200"
            >
              Website
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
