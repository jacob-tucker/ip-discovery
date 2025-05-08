"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { use } from "react";
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
import IPRoyalties from "@/components/IPRoyalties";
import Footer from "@/components/Footer";
import { getStoryIPAssetById } from "@/lib/data";
import MediaRenderer from "@/components/MediaRenderer";
import AudioPlayer from "@/components/AudioPlayer";

interface IPPageProps {
  params: Promise<{
    ipId: string;
  }>;
}

export default function IPPage({ params }: IPPageProps) {
  const unwrappedParams = use(params);
  const decodedIpId = decodeURIComponent(unwrappedParams.ipId);

  const {
    data: ip,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ipAsset", decodedIpId],
    queryFn: () => getStoryIPAssetById(decodedIpId),
  });

  console.log("ip", ip);

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

  const isAudio = ip.mediaType.startsWith("audio/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-grow">
        <div className="container py-4">
          <div className="bg-cardBg rounded-md border border-border overflow-hidden mb-4">
            <div className="flex flex-col md:flex-row">
              <div className="relative md:w-1/4 lg:w-1/5 md:border-r border-border">
                <div
                  className={`${isAudio ? "md:h-full" : "aspect-square"} relative overflow-hidden`}
                >
                  <MediaRenderer
                    mediaUrl={ip.mediaUrl}
                    mediaType={ip.mediaType}
                    title={ip.title}
                    fallbackImageUrl={ip.image}
                  />
                </div>

                {isAudio && (
                  <div className="p-3 block md:hidden">
                    <AudioPlayer audioUrl={ip.mediaUrl} title={ip.title} />
                  </div>
                )}
              </div>

              <div className="flex-1 p-4">
                <div>
                  <div className="flex justify-between items-start">
                    <h1 className="text-xl font-bold">{ip.title}</h1>
                  </div>
                  <p className="text-xs text-textMuted mt-1 mb-4 max-w-2xl">
                    {ip.description}
                  </p>
                </div>

                <IPStats ip={ip} />

                {isAudio && (
                  <div className="mt-4 max-w-md hidden md:block">
                    <AudioPlayer audioUrl={ip.mediaUrl} title={ip.title} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <IPDetails ip={ip} />
              <div className="mt-4">
                <IPRoyalties ip={ip} />
              </div>
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
