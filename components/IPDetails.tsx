"use client";

import { IPAsset } from "@/types/ip";
import {
  User,
  FileText,
  Calendar,
  ExternalLink,
  CreditCard,
  AlertTriangle,
  Copy,
} from "lucide-react";

interface IPDetailsProps {
  ip: IPAsset;
}

export default function IPDetails({ ip }: IPDetailsProps) {
  // Mock data for licenses and disputes
  const mockStats = {
    licensesMinted: Math.floor(Math.random() * 50) + 5,
    activeDisputes: Math.floor(Math.random() * 3),
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  return (
    <div className="bg-cardBg rounded-md border border-border">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 p-3">
        <div>
          <p className="text-xs text-textMuted">Created</p>
          <div className="flex items-center mt-0.5">
            <Calendar className="h-3 w-3 text-accentOrange mr-1" />
            <p className="text-xs font-medium">
              {new Date(Number(ip.createdAt) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-textMuted">Type</p>
          <div className="flex items-center mt-0.5">
            <FileText className="h-3 w-3 text-accentPurple mr-1" />
            <p className="text-xs font-medium">{ip.ipType}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-textMuted">Licenses Minted</p>
          <div className="flex items-center mt-0.5">
            <CreditCard className="h-3 w-3 text-accentGreen mr-1" />
            <p className="text-xs font-medium">{mockStats.licensesMinted}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-textMuted">Active Disputes</p>
          <div className="flex items-center mt-0.5">
            <AlertTriangle className="h-3 w-3 text-accentOrange mr-1" />
            <p className="text-xs font-medium">{mockStats.activeDisputes}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1 text-accentOrange" />
            <h3 className="text-xs font-semibold">
              Creators ({ip.creators.length})
            </h3>
          </div>
          <a href="#" className="text-xs text-accentPurple">
            View all
          </a>
        </div>

        <div className="space-y-2">
          {ip.creators.slice(0, 2).map((creator) => (
            <div key={creator.address} className="bg-background rounded-md p-2">
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-xs">{creator.name}</p>
                <div className="text-accentOrange text-xs px-1.5 py-0.5 rounded-full bg-accentOrange/10">
                  {creator.contributionPercent}%
                </div>
              </div>
              <div className="flex items-center text-xs text-textMuted">
                <span
                  className="font-mono truncate max-w-[120px] sm:max-w-[200px]"
                  title={creator.address}
                >
                  {creator.address.substring(0, 8)}...
                  {creator.address.substring(creator.address.length - 6)}
                </span>
                <button
                  onClick={() => copyToClipboard(creator.address)}
                  className="ml-1 text-textMuted hover:text-accentPurple transition-colors"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {ip.creators.length > 2 && (
            <div className="text-center text-xs text-textMuted">
              + {ip.creators.length - 2} more creators
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <ExternalLink className="h-4 w-4 mr-1 text-accentGreen" />
            <h3 className="text-xs font-semibold">External Resources</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={ip.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accentPurple hover:underline bg-background p-1.5 rounded flex items-center"
          >
            <FileText className="h-3 w-3 mr-1" />
            View on IPFS
          </a>

          {ip.creators[0].socialMedia.slice(0, 1).map((social) => (
            <a
              key={social.url}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accentPurple hover:underline bg-background p-1.5 rounded flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {social.platform}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
