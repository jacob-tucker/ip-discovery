"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Clock,
  FileText,
  Shield,
  Hash,
  RefreshCw,
  Zap,
  Flame,
  TrendingUp,
  Check,
  Eye,
} from "lucide-react";
import { IPAsset } from "@/types/ip";

interface IPStatsProps {
  ip: IPAsset;
}

export default function IPStats({ ip }: IPStatsProps) {
  // Mock stats for visualization
  const stats = [
    {
      label: "Views",
      value: Math.floor(Math.random() * 900) + 100,
      icon: <Eye className="h-3 w-3 text-white" />,
      color: "bg-gradient-to-r from-red-500 to-orange-400",
    },
    {
      label: "Score",
      value: `${Math.floor(Math.random() * 30) + 70}/100`,
      icon: <TrendingUp className="h-3 w-3 text-white" />,
      color: "bg-gradient-to-r from-green-500 to-emerald-400",
    },
    {
      label: "Type",
      value: ip.mediaType,
      icon: <FileText className="h-3 w-3 text-white" />,
      color: "bg-gradient-to-r from-purple-500 to-indigo-400",
    },
    {
      label: "Age",
      value: `${Math.floor((Date.now() - Number(ip.createdAt) * 1000) / (1000 * 60 * 60 * 24))} days`,
      icon: <Clock className="h-3 w-3 text-white" />,
      color: "bg-gradient-to-r from-blue-500 to-cyan-400",
    },
  ];

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-cardBg rounded-md border border-border p-2 flex items-center"
          >
            <div
              className={`${stat.color} rounded-full p-1 mr-2 flex-shrink-0`}
            >
              {stat.icon}
            </div>
            <div>
              <h4 className="text-xs text-textMuted">{stat.label}</h4>
              <p className="text-sm font-semibold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <motion.div
          className="bg-cardBg rounded-md border border-border p-2 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2 text-accentGreen" />
            <span className="text-xs">Verification Status</span>
          </div>
          <div className="bg-accentGreen/10 text-accentGreen text-xs py-0.5 px-2 rounded-full flex items-center">
            <Check className="h-3 w-3 mr-1" />
            Verified
          </div>
        </motion.div>

        <motion.div
          className="bg-cardBg rounded-md border border-border p-2 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.25 }}
        >
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-2 text-accentOrange" />
            <span className="text-xs">Hash Strength</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="flex space-x-0.5">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-4 rounded-sm ${i < 4 ? "bg-accentOrange" : "bg-gray-200"}`}
                />
              ))}
            </div>
            <span className="ml-2 text-textMuted">Strong</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="flex justify-end items-center mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.3 }}
      >
        <div className="flex items-center text-xs text-textMuted">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          <span>Last verified 2h ago</span>
        </div>
      </motion.div>
    </div>
  );
}
