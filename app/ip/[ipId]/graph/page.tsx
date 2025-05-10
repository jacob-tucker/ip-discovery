"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DerivativeGraphPage() {
  const { ipId } = useParams();
  const decodedIpId = decodeURIComponent(ipId as string);

  return (
    <div className="h-full min-h-screen bg-background">
      <div className="container py-4">
        <div className="flex items-center mb-4">
          <Link 
            href={`/ip/${encodeURIComponent(decodedIpId)}`} 
            className="flex items-center text-sm font-medium text-textMuted hover:text-text transition-colors mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to IP Details
          </Link>
          <h1 className="text-xl font-bold">Derivative Galaxy</h1>
        </div>
        
        <div className="bg-cardBg rounded-md border border-border p-4 mb-4">
          <p className="text-sm text-textMuted mb-2">
            View the relationships between this IP and its derivatives.
          </p>
          <p className="text-sm font-medium">
            IP ID: {decodedIpId}
          </p>
        </div>
        
        <div className="bg-cardBg rounded-md border border-border overflow-hidden" style={{ height: "70vh" }}>
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <p className="text-lg font-semibold mb-2">Derivative Galaxy Coming Soon</p>
              <p className="text-sm text-textMuted">
                Graph visualization is currently being implemented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}