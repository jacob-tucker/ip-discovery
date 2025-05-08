"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Clock,
  FileText,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { IPAsset } from "@/types/ip";

interface IPStatsProps {
  ip: IPAsset;
}

export default function IPStats({ ip }: IPStatsProps) {
  // Mock stats for visualization - using static seed numbers to prevent regeneration on refresh
  const stats = [
    {
      label: "Views",
      value: 325,
      icon: <Eye className="h-3 w-3 text-accentOrange" />,
    },
    {
      label: "Age",
      value: `${Math.floor((Date.now() - Number(ip.createdAt) * 1000) / (1000 * 60 * 60 * 24))} days`,
      icon: <Clock className="h-3 w-3 text-accentPurple" />,
    },
    {
      label: "Licenses",
      value: 42,
      icon: <CreditCard className="h-3 w-3 text-accentGreen" />,
    },
    {
      label: "Disputes",
      value: 2,
      icon: <AlertTriangle className="h-3 w-3 text-accentOrange" />,
    },
  ];

  // Static activity metrics to prevent rerendering
  const activityData = [35, 20, 45, 30, 50, 25, 40];
  const maxActivity = Math.max(...activityData);

  return (
    <div className="flex flex-col md:flex-row gap-2 mb-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-grow">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-cardBg rounded-md border border-border p-2 flex items-center"
          >
            <div className="bg-background rounded-full p-1 mr-2 flex-shrink-0">
              {stat.icon}
            </div>
            <div>
              <h4 className="text-xs text-textMuted">{stat.label}</h4>
              <p className="text-sm font-semibold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-cardBg rounded-md border border-border p-2 md:w-48">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <TrendingUp className="h-3 w-3 mr-1 text-accentGreen" />
            <h4 className="text-xs font-medium">Activity</h4>
          </div>
          <span className="text-xs text-textMuted">7 days</span>
        </div>

        <div className="flex items-end h-10 gap-0.5 mt-1">
          {activityData.map((value, i) => (
            <div
              key={i}
              className="bg-accentGreen/20 rounded-sm flex-1"
              style={{ height: `${(value / maxActivity) * 100}%` }}
            >
              <div
                className="bg-accentGreen rounded-sm w-full"
                style={{
                  height: `${Math.min(25, (value / maxActivity) * 100)}%`,
                }}
              ></div>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-1 text-[10px] text-textMuted">
          <span>Mon</span>
          <span>Wed</span>
          <span>Sun</span>
        </div>
      </div>
    </div>
  );
}
