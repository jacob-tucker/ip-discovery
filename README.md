# IP Discovery Platform

A platform for discovering intellectual property assets on the Story blockchain.

## Overview

IP Discovery is a platform that allows users to browse and search through a curated list of IP assets registered on the Story blockchain. The platform provides detailed information about each asset, including its creators, tags, and links to the original content on IPFS.

## Features

- Browse and search through IP assets
- View detailed information about each IP asset
- Discover creators and their social media profiles
- Access links to the original IP content on IPFS

## Tech Stack

- Next.js 15
- React 19
- TanStack Query (React Query)
- Tailwind CSS
- Framer Motion
- TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/jacob-tucker/ip-discovery.git
cd ip-discovery
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Add env variables:

Rename .env.example to .env and add an API key found here: https://docs.story.foundation/api-reference/protocol/introduction

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utility functions
- `types/` - TypeScript types
- `data/` - Mock data for development

## About Story

Story is an open standard and protocol for defining the attribution and usage permissions of intellectual property (IP), similar to how the Internet Protocol (IP) standardized the transmission of data packets.

By leveraging blockchain technology, Story ensures transparent and immutable records of IP ownership and usage rights, creating new opportunities for creators in the digital economy.

## License

MIT
