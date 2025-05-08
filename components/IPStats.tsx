"use client";

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
} from "lucide-react";
import { IPAsset } from "@/types/ip";

interface IPStatsProps {
  ip: IPAsset;
}

export default function IPStats({ ip }: IPStatsProps) {
  // Format media type for display
  const formatMediaType = (mediaType: string) => {
    const [type, format] = mediaType.split("/");
    return `${format.toUpperCase()}`;
  };

  // Get media type icon
  const getMediaTypeIcon = (mediaType: string) => {
    if (mediaType.startsWith("audio/")) {
      return <Music className="h-3 w-3 text-accentOrange" />;
    } else if (mediaType.startsWith("video/")) {
      return <Video className="h-3 w-3 text-accentGreen" />;
    } else {
      return <ImageIcon className="h-3 w-3 text-accentPurple" />;
    }
  };

  // Group stats into categories for better organization
  const statGroups = [
    {
      title: "Asset",
      stats: [
        {
          label: "Created",
          value: new Date(Number(ip.createdAt) * 1000).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "short",
              day: "numeric",
            }
          ),
          icon: <Calendar className="h-3 w-3 text-accentPurple" />,
        },
        {
          label: "Media Type",
          value: formatMediaType(ip.mediaType),
          icon: getMediaTypeIcon(ip.mediaType),
        },
      ],
    },
    {
      title: "Engagement",
      stats: [
        {
          label: "Views",
          value: 325,
          icon: <Eye className="h-3 w-3 text-accentOrange" />,
        },
        {
          label: "Licenses",
          value: 42,
          icon: <CreditCard className="h-3 w-3 text-accentGreen" />,
        },
      ],
    },
    {
      title: "Disputes",
      stats: [
        {
          label: "Active",
          value: 2,
          icon: <AlertTriangle className="h-3 w-3 text-accentOrange" />,
        },
        {
          label: "Resolved",
          value: 5,
          icon: <Shield className="h-3 w-3 text-accentGreen" />,
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
                <p className="text-xs font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
