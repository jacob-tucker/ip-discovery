"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container flex flex-col items-center justify-center py-24 text-center flex-grow">
        <h1 className="text-4xl font-bold">404 - Not Found</h1>
        <p className="mt-4 text-textMuted">
          The IP asset you are looking for could not be found or does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-accentOrange px-6 py-2 text-white transition-colors hover:bg-accentOrange/90"
        >
          Back to Home
        </Link>
      </div>
      <Footer />
    </div>
  );
}
