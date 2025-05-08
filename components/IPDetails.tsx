"use client";

import { IPAsset } from "@/types/ip";
import {
  User,
  FileText,
  Hash,
  Percent,
  Calendar,
  BarChart,
  Shield,
  Flame,
  Database,
} from "lucide-react";

interface IPDetailsProps {
  ip: IPAsset;
}

export default function IPDetails({ ip }: IPDetailsProps) {
  return (
    <div className="bg-cardBg rounded-md border border-border p-3">
      <div className="flex items-center mb-3">
        <Database className="h-4 w-4 mr-2 text-accentGreen rounded-full p-1 bg-accentGreen/10" />
        <h3 className="text-sm font-semibold">IP Information</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="flex items-start space-x-2">
          <Calendar className="h-3 w-3 mt-0.5 text-accentOrange flex-shrink-0" />
          <div>
            <p className="text-xs text-textMuted">Created On</p>
            <p className="text-xs font-medium">
              {new Date(Number(ip.createdAt) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <FileText className="h-3 w-3 mt-0.5 text-accentPurple flex-shrink-0" />
          <div>
            <p className="text-xs text-textMuted">Asset Type</p>
            <p className="text-xs font-medium">{ip.ipType}</p>
          </div>
        </div>

        <div className="flex items-start space-x-2 col-span-full">
          <Hash className="h-3 w-3 mt-0.5 text-accentGreen flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-textMuted">Media Hash</p>
            <p className="text-xs font-mono truncate" title={ip.mediaHash}>
              {ip.mediaHash}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-accentOrange rounded-full p-1 bg-accentOrange/10" />
            <h3 className="text-sm font-semibold">Creators</h3>
          </div>
          <span className="text-xs text-textMuted">
            {ip.creators.length} total
          </span>
        </div>

        <div className="space-y-2">
          {ip.creators.map((creator) => (
            <div key={creator.address} className="bg-background rounded-md p-2">
              <div className="flex justify-between items-start">
                <p className="font-medium text-xs">{creator.name}</p>
                <div className="flex items-center bg-accentOrange/10 text-accentOrange text-xs px-1.5 py-0.5 rounded-full">
                  <Percent className="h-2.5 w-2.5 mr-0.5" />
                  {creator.contributionPercent}%
                </div>
              </div>
              {creator.description && (
                <p className="text-xs text-textMuted mt-0.5 line-clamp-1">
                  {creator.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
