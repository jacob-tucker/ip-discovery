"use client";

import Image from "next/image";
import Link from "next/link";
import { IPAsset } from "@/types/ip";
import { motion } from "framer-motion";
import { Calendar, Tag as TagIcon } from "lucide-react";

interface IPCardProps {
  ip: IPAsset;
}

export default function IPCard({ ip }: IPCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="card hover:shadow-lg transition-shadow"
    >
      <Link href={`/ip/${encodeURIComponent(ip.title)}`}>
        <div className="flex space-x-4">
          <div className="relative h-24 w-24">
            <Image
              src={ip.image}
              alt={ip.title}
              fill
              className="rounded-md object-cover"
              sizes="96px"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{ip.title}</h3>
            <p className="text-sm text-textMuted mt-1">{ip.description}</p>
            <div className="mt-3 flex items-center space-x-3 text-sm text-textMuted">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {new Date(Number(ip.createdAt) * 1000).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <TagIcon className="mr-1 h-4 w-4" />
                {ip.ipType}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ip.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
