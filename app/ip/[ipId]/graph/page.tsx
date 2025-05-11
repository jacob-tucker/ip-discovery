"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info, ExternalLink } from "lucide-react";
import DerivativeGraph from "@/components/IPGraph/DerivativeGraph";
import { useIPAsset } from "@/lib/hooks/useDerivativeData";
import { GraphNode } from "@/types/graph";

export default function DerivativeGraphPage() {
  const { ipId } = useParams();
  const router = useRouter();
  const decodedIpId = decodeURIComponent(ipId as string);
  
  // Get IP asset data
  const { data: ipAsset, isLoading: isLoadingIP } = useIPAsset(decodedIpId);
  
  // State for selected node info
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);
  
  // Navigate to IP detail page when node is clicked
  const handleNodeDetails = useCallback(() => {
    if (selectedNode) {
      router.push(`/ip/${encodeURIComponent(selectedNode.id)}`);
    }
  }, [selectedNode, router]);
  
  return (
    <div className="h-full min-h-screen bg-background w-full">
      <div className="w-full px-4 py-4">
        {/* Header section */}
        <div className="flex items-center mb-4">
          <Link
            href={`/ip/${encodeURIComponent(decodedIpId)}`}
            className="flex items-center text-sm font-medium text-textMuted hover:text-text transition-colors mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to IP Details
          </Link>
          <h1 className="text-xl font-bold">
            Derivative Galaxy
          </h1>
        </div>
        
        {/* IP info section */}
        <div className="bg-cardBg rounded-md border border-border p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-textMuted mb-2">
                View the relationships between this IP and its derivatives.
              </p>
              <p className="text-sm font-medium">
                IP ID: {decodedIpId}
              </p>
              {ipAsset && (
                <p className="text-sm font-medium mt-1">
                  Title: {ipAsset.title}
                </p>
              )}
            </div>
            
            {/* Selected node info */}
            {selectedNode && selectedNode.id !== decodedIpId && (
              <div className="bg-background rounded-md p-3 border border-border">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold">Selected IP</h3>
                  <button 
                    onClick={handleNodeDetails}
                    className="text-primary hover:text-primary/80 text-xs flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Details
                  </button>
                </div>
                <p className="text-xs mt-1 font-medium">{selectedNode.title}</p>
                <p className="text-xs text-textMuted mt-1">{selectedNode.id}</p>
                <p className="text-xs mt-2 bg-black/5 px-1.5 py-0.5 rounded inline-block">
                  {selectedNode.type}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Graph container */}
        <div
          className="bg-cardBg rounded-md border border-border overflow-hidden w-full"
          style={{ height: "70vh" }}
        >
          <DerivativeGraph 
            ipId={decodedIpId}
            height={undefined} // Let it use container height
            width={undefined} // Let it use container width
            onNodeClick={handleNodeClick}
            className="h-full w-full"
          />
        </div>
        
        {/* Helper text */}
        <div className="mt-3 flex items-start">
          <Info className="h-4 w-4 text-textMuted mr-2 mt-0.5" />
          <p className="text-xs text-textMuted">
            Hover over nodes to see details. Click on a node to select it and see its data.
            Use the controls in the bottom left to zoom and reset the view.
          </p>
        </div>
      </div>
    </div>
  );
}