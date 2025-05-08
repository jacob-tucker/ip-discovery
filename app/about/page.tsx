"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-12 flex-grow">
        <div className="card max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold">About IP Discovery</h1>
          <div className="mt-6 space-y-6 text-textMuted">
            <p>
              IP Discovery is a platform for discovering Intellectual Property
              (IP) assets registered on the Story Protocol blockchain. Story
              Protocol is an open standard and protocol for defining the
              attribution and usage permissions of intellectual property (IP),
              similar to how the Internet Protocol (IP) standardized the
              transmission of data packets.
            </p>
            <p>
              The platform allows users to browse through a curated list of IP
              assets, view detailed information about each asset, and discover
              the creators behind them. It serves as a showcase for the
              capabilities of the Story Protocol in managing and tracking
              intellectual property in a decentralized manner.
            </p>
            <h2 className="text-2xl font-semibold pt-4">Key Features</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Browse and search through IP assets</li>
              <li>
                View detailed information about each IP asset, including its
                creators and tags
              </li>
              <li>Discover social media profiles of creators</li>
              <li>Access links to the original IP content on IPFS</li>
            </ul>
            <h2 className="text-2xl font-semibold pt-4">
              About Story Protocol
            </h2>
            <p>
              Story Protocol is a decentralized protocol that enables the
              creation, ownership, and monetization of IP assets. It provides a
              framework for creators to register their IP, establish clear
              attribution, set usage permissions, and potentially earn royalties
              when their work is used by others.
            </p>
            <p>
              By leveraging blockchain technology, Story Protocol ensures
              transparent and immutable records of IP ownership and usage
              rights, creating new opportunities for creators in the digital
              economy.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
