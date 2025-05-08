"use client";

import Link from "next/link";
import { Search } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-cardBg py-6 shadow">
      <div className="container flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold">
          IP Discovery
        </Link>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-textMuted" />
            <input
              type="text"
              placeholder="Search IPs..."
              className="rounded-full bg-background pl-10 pr-4 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accentOrange"
            />
          </div>
          <nav>
            <Link href="/about" className="text-sm hover:text-accentOrange">
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
