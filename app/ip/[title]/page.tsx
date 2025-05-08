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
import IPLicenses from "@/components/IPLicenses";
import Footer from "@/components/Footer";
import { getIPAssetByTitle } from "@/lib/data";
import Image from "next/image";

interface IPPageProps {
  params: Promise<{
    title: string;
  }>;
}

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
          <div className="inline-flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4 text-accentOrange" />
            <p className="text-textMuted text-sm">Loading IP details...</p>
          </div>
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
        <div className="container py-4">
          <div className="bg-cardBg rounded-md border border-border overflow-hidden mb-4">
            <div className="flex flex-col md:flex-row">
              <div className="relative md:w-1/4 lg:w-1/5">
                <div className="aspect-square relative">
                  <Image
                    src={ip.image}
                    alt={ip.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
                    priority
                  />
                </div>
              </div>

              <div className="flex-1 p-4">
                <div>
                  <div className="flex justify-between items-start">
                    <h1 className="text-xl font-bold">{ip.title}</h1>
                    <span className="bg-accentPurple/10 text-accentPurple text-xs px-2 py-0.5 rounded-full">
                      {ip.ipType}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted mt-1 mb-4 max-w-2xl">
                    {ip.description}
                  </p>
                </div>

                <IPStats ip={ip} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <IPDetails ip={ip} />
            </div>

            <div className="md:col-span-2">
              <IPLicenses ip={ip} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
