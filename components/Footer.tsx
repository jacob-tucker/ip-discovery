"use client";

export default function Footer() {
  return (
    <footer className="bg-cardBg py-8 border-t border-border">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-textMuted text-sm">
              &copy; {new Date().getFullYear()} IP on Top
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-textMuted">
            Powered by Story, created by{" "}
            <a
              href="https://x.com/jacobmtucker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accentPurple hover:text-accentOrange transition-colors"
            >
              Jacob Tucker
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
