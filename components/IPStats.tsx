"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Clock,
  Calendar,
  CreditCard,
  AlertTriangle,
  Globe,
  Users,
  Shield,
  BarChart,
  FileType,
  Music,
  Video,
  Image as ImageIcon,
  GitBranch,
} from "lucide-react";
import { IPAsset } from "@/types/ip";
import { getAssetDataFromStory, getDisputesForIP } from "@/lib/data";
import { formatDate, formatMediaType } from "@/lib/utils";

interface IPStatsProps {
  ip: IPAsset;
}

// Skeleton animation class for loading states
const skeletonClass = "animate-pulse bg-gray-200 rounded";

export default function IPStats({ ip }: IPStatsProps) {
  const [derivativeCount, setDerivativeCount] = useState<number | null>(null);
  const [disputeCount, setDisputeCount] = useState<number | null>(null);
  const [isLoadingDerivatives, setIsLoadingDerivatives] = useState(true);
  const [isLoadingDisputes, setIsLoadingDisputes] = useState(true);

  // Fetch derivative count data when component mounts
  useEffect(() => {
    const fetchDerivativeData = async () => {
      try {
        setIsLoadingDerivatives(true);
        const assetData = await getAssetDataFromStory(ip.ipId);
        if (assetData) {
          setDerivativeCount(assetData.descendantCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch derivative data:", error);
      } finally {
        setIsLoadingDerivatives(false);
      }
    };

    fetchDerivativeData();
  }, [ip.ipId]);

  // Fetch dispute count data when component mounts
  useEffect(() => {
    const fetchDisputeData = async () => {
      try {
        setIsLoadingDisputes(true);
        const count = await getDisputesForIP(ip.ipId);
        setDisputeCount(count);
      } catch (error) {
        console.error("Failed to fetch dispute data:", error);
      } finally {
        setIsLoadingDisputes(false);
      }
    };

    fetchDisputeData();
  }, [ip.ipId]);

  // Get media type icon
  const getMediaTypeIcon = (mediaType: string) => {
    const { type } = formatMediaType(mediaType);
    if (type === "AUDIO") {
      return <Music className="h-3 w-3 text-accentOrange" />;
    } else if (type === "VIDEO") {
      return <Video className="h-3 w-3 text-accentGreen" />;
    } else {
      return <ImageIcon className="h-3 w-3 text-accentPurple" />;
    }
  };

  // Format media type for display
  const getDisplayMediaType = (mediaType: string) => {
    const { type, format } = formatMediaType(mediaType);
    if (format) {
      return `${type} • ${format}`;
    }
    return type;
  };

  // Group stats into categories for better organization
  const statGroups = [
    {
      title: "Asset",
      stats: [
        {
          label: "Created",
          value: formatDate(ip.createdAt),
          icon: <Calendar className="h-3 w-3 text-accentPurple" />,
          loading: false,
        },
        {
          label: "Media Type",
          value: getDisplayMediaType(ip.mediaType),
          icon: getMediaTypeIcon(ip.mediaType),
          loading: false,
        },
      ],
    },
    {
      title: "Engagement",
      stats: [
        {
          label: "Derivatives",
          value: derivativeCount !== null ? derivativeCount : 0,
          icon: <GitBranch className="h-3 w-3 text-accentGreen" />,
          loading: isLoadingDerivatives,
        },
      ],
    },
    {
      title: "Disputes",
      stats: [
        {
          label: "Raised",
          value: disputeCount !== null ? disputeCount : 0,
          icon: <AlertTriangle className="h-3 w-3 text-accentOrange" />,
          loading: isLoadingDisputes,
        },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
      {statGroups.map((group) => (
        <div key={group.title} className="bg-background rounded-md p-2">
          <h4 className="text-xs font-medium text-textMuted mb-2">
            {group.title}
          </h4>
          <div className="space-y-2">
            {group.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="mr-1.5 md:mr-2 flex-shrink-0 text-textMuted">
                    {stat.icon}
                  </div>
                  <p className="text-xs">{stat.label}</p>
                </div>
                {stat.loading ? (
                  <div className={`h-3 w-8 ${skeletonClass}`}></div>
                ) : (
                  <p className="text-xs font-semibold">{stat.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
