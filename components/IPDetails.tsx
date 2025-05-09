"use client";

import { IPAsset } from "@/types/ip";
import {
  User,
  FileText,
  ExternalLink,
  Copy,
  Link,
  Github,
  Twitter,
  Instagram,
  Globe,
  Mail,
  Linkedin,
  Youtube,
  FileJson,
  Search,
  Database,
  MessageCircle,
  Hash,
} from "lucide-react";

interface IPDetailsProps {
  ip: IPAsset;
}

export default function IPDetails({ ip }: IPDetailsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  // Helper to get appropriate icon for social platform
  const getSocialIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes("github")) return <Github className="h-3 w-3" />;
    if (platformLower.includes("twitter") || platformLower.includes("x"))
      return <Twitter className="h-3 w-3" />;
    if (platformLower.includes("instagram"))
      return <Instagram className="h-3 w-3" />;
    if (platformLower.includes("linkedin"))
      return <Linkedin className="h-3 w-3" />;
    if (platformLower.includes("youtube"))
      return <Youtube className="h-3 w-3" />;
    if (platformLower.includes("mail") || platformLower.includes("email"))
      return <Mail className="h-3 w-3" />;
    if (platformLower.includes("telegram") || platformLower.includes("t.me"))
      return <MessageCircle className="h-3 w-3" />;
    if (platformLower.includes("discord")) return <Hash className="h-3 w-3" />;
    return <Globe className="h-3 w-3" />;
  };

  // Function to format address for display
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="bg-cardBg rounded-md border border-border">
      {ip.creators.length > 0 && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1 text-accentOrange" />
              <h3 className="text-xs font-semibold">Creators</h3>
            </div>
            {ip.creators.length > 2 && (
              <a href="#" className="text-xs text-accentPurple">
                View all
              </a>
            )}
          </div>

          <div className="space-y-3">
            {ip.creators.slice(0, 2).map((creator) => (
              <div
                key={creator.address}
                className="bg-background rounded-md p-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium text-xs mr-1">{creator.name}</p>
                      {creator.contributionPercent && (
                        <div className="text-accentOrange text-xs px-1.5 py-0.5 rounded-full bg-accentOrange/10">
                          {creator.contributionPercent}%
                        </div>
                      )}
                    </div>

                    {creator.description && (
                      <p className="text-xs text-textMuted mt-1 line-clamp-1">
                        {creator.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Creator address */}
                <div className="flex items-center mt-1 mb-1">
                  <p className="text-[10px] text-textMuted font-mono">
                    {formatAddress(creator.address)}
                  </p>
                  <button
                    onClick={() => copyToClipboard(creator.address)}
                    className="ml-1 text-textMuted hover:text-accentPurple transition-colors"
                  >
                    <Copy className="h-2 w-2" />
                  </button>
                </div>

                {/* Social media icons */}
                {creator.socialMedia && creator.socialMedia.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {creator.socialMedia.map((social) => (
                      <a
                        key={social.url}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accentPurple hover:bg-accentPurple/20 p-1 rounded-full transition-colors"
                        title={`${creator.name}'s ${social.platform}`}
                      >
                        {getSocialIcon(social.platform)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {ip.creators.length > 2 && (
              <div className="text-center text-xs text-textMuted">
                + {ip.creators.length - 2} more creators
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Link className="h-4 w-4 mr-1 text-accentGreen" />
            <h3 className="text-xs font-semibold">Asset Resources</h3>
          </div>
        </div>

        <div className="bg-background rounded-md p-2">
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <a
              href={ip.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] py-1.5 px-1 rounded flex items-center justify-center border border-border/40 hover:border-accentPurple/30 hover:bg-accentPurple/5 transition-all group"
            >
              <ExternalLink className="h-2.5 w-2.5 mr-1.5 text-accentPurple opacity-70 group-hover:opacity-100" />
              <span>View Asset</span>
            </a>
            <a
              href={
                ip.metadataUri || `https://example.com/metadata/${ip.mediaHash}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] py-1.5 px-1 rounded flex items-center justify-center border border-border/40 hover:border-accentPurple/30 hover:bg-accentPurple/5 transition-all group"
            >
              <ExternalLink className="h-2.5 w-2.5 mr-1.5 text-accentPurple opacity-70 group-hover:opacity-100" />
              <span>View Metadata</span>
            </a>
            <a
              href={`https://explorer.story.foundation/ipa/${ip.ipId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] py-1.5 px-1 rounded flex items-center justify-center border border-border/40 hover:border-accentPurple/30 hover:bg-accentPurple/5 transition-all group"
            >
              <ExternalLink className="h-2.5 w-2.5 mr-1.5 text-accentPurple opacity-70 group-hover:opacity-100" />
              <span>Open in Explorer</span>
            </a>
            <a
              href={`https://portal.story.foundation/assets/${ip.ipId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] py-1.5 px-1 rounded flex items-center justify-center border border-border/40 hover:border-accentPurple/30 hover:bg-accentPurple/5 transition-all group"
            >
              <ExternalLink className="h-2.5 w-2.5 mr-1.5 text-accentPurple opacity-70 group-hover:opacity-100" />
              <span>Open in Portal</span>
            </a>
          </div>

          {ip.mediaHash && (
            <div className="text-xs text-textMuted mt-1 flex items-center justify-between border-t border-border/30 pt-2">
              <span className="text-[10px]">Asset Hash:</span>
              <div className="flex items-center">
                <span
                  className="font-mono text-[9px] truncate max-w-[100px]"
                  title={ip.mediaHash}
                >
                  {ip.mediaHash.substring(0, 10)}...
                </span>
                <button
                  onClick={() => copyToClipboard(ip.mediaHash)}
                  className="ml-1 text-textMuted hover:text-accentPurple transition-colors"
                >
                  <Copy className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
