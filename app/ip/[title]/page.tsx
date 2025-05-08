"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { use } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Calendar,
  User,
  Tag as TagIcon,
  Link as LinkIcon,
  ExternalLink,
  Clock,
} from "lucide-react";
import Header from "@/components/Header";
import IPDetails from "@/components/IPDetails";
import IPStats from "@/components/IPStats";
import Footer from "@/components/Footer";
import { getIPAssetByTitle } from "@/lib/data";
import Image from "next/image";

interface IPPageProps {
  params: Promise<{
    title: string;
  }>;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function IPPage({ params }: IPPageProps) {
  const unwrappedParams = use(params);
  const decodedTitle = decodeURIComponent(unwrappedParams.title);

  const {
    data: ip,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ipAsset", decodedTitle],
    queryFn: () => getIPAssetByTitle(decodedTitle),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-4 text-center flex-grow">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="inline-flex items-center justify-center space-x-2"
          >
            <Clock className="h-4 w-4 text-accentOrange" />
            <p className="text-textMuted text-sm">Loading IP details...</p>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !ip) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-grow">
        <motion.div
          className="container py-4"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-cardBg rounded-lg shadow-card border border-border overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Image container with fixed aspect ratio */}
              <div className="relative md:w-1/3 lg:w-1/4">
                <div className="aspect-square relative">
                  <Image
                    src={ip.image}
                    alt={ip.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    priority
                  />
                </div>
              </div>

              {/* Content container */}
              <div className="flex-1 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold">{ip.title}</h1>
                    <div className="flex flex-wrap items-center space-x-3 mt-1 text-xs text-textMuted">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3 text-accentOrange" />
                        {new Date(
                          Number(ip.createdAt) * 1000
                        ).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3 text-accentGreen" />
                        {ip.creators[0].name}
                      </div>
                      <div className="flex items-center">
                        <FileText className="mr-1 h-3 w-3 text-accentPurple" />
                        {ip.ipType}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {ip.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag text-xs">
                        {tag}
                      </span>
                    ))}
                    {ip.tags.length > 3 && (
                      <span className="text-xs text-textMuted">
                        +{ip.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-textMuted mt-2 line-clamp-2">
                  {ip.description}
                </p>
              </div>
            </div>

            <div className="px-4 pb-4">
              <IPStats ip={ip} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-2">
                  <IPDetails ip={ip} />
                </div>

                <div>
                  <div className="card h-full">
                    <div className="flex items-center mb-3">
                      <ExternalLink className="h-4 w-4 mr-2 text-accentOrange rounded-full p-1 bg-accentOrange/10" />
                      <h3 className="text-sm font-semibold">Quick Links</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <a
                        href={ip.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-accentOrange hover:underline"
                      >
                        <LinkIcon className="mr-1 h-3 w-3" />
                        View Asset on IPFS
                      </a>
                      {ip.creators.map(
                        (creator) =>
                          creator.socialMedia.length > 0 && (
                            <div key={creator.address} className="pt-1">
                              <p className="text-xs font-medium">
                                {creator.name}'s Links:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {creator.socialMedia.map((social) => (
                                  <a
                                    key={social.url}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-accentPurple/10 text-accentPurple px-2 py-0.5 rounded-full hover:bg-accentPurple/20 transition-colors"
                                  >
                                    {social.platform}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {ip.tags.length > 3 && (
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <TagIcon className="h-4 w-4 mr-1 text-accentPurple rounded-full p-1 bg-accentPurple/10" />
                    <h3 className="text-sm font-semibold">All Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ip.tags.map((tag) => (
                      <span key={tag} className="tag text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
