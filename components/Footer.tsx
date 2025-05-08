"use client";

export default function Footer() {
  return (
    <footer className="bg-cardBg py-8 border-t border-border">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-textMuted text-sm">
              &copy; {new Date().getFullYear()} IP Discovery Platform
            </p>
            <p className="text-xs text-textMuted mt-1">
              Powered by Story Protocol
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a
              href="https://story.foundation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-textMuted hover:text-accentOrange"
            >
              Story Foundation
            </a>
            <a
              href="https://twitter.com/storyprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-textMuted hover:text-accentOrange"
            >
              Twitter
            </a>
            <a
              href="https://discord.gg/storyprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-textMuted hover:text-accentOrange"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
