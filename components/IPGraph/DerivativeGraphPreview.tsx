"use client"

import React, {useEffect, useRef, useState} from "react"
import dynamic from "next/dynamic"
import {useGraphData} from "@/lib/hooks/useDerivativeData"
import {getNodeColor, getLinkColor} from "@/lib/utils/graph/graph-transform"
import {GraphNode, GraphLink, NodeType} from "@/types/graph"

// Import ForceGraph2D dynamically to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full w-full'>
      <div className='animate-pulse text-sm text-textMuted'>
        Loading graph preview...
      </div>
    </div>
  ),
})

interface DerivativeGraphPreviewProps {
  ipId: string
  height?: number
  width?: number
  className?: string
}

/**
 * DerivativeGraphPreview Component
 *
 * A simplified, non-interactive preview of the derivative graph
 * for displaying in the IP detail page.
 */
const DerivativeGraphPreview = ({
  ipId,
  width = 500,
  height = 300,
  className = "",
}: DerivativeGraphPreviewProps) => {
  // Reference to the container div
  const containerRef = useRef<HTMLDivElement>(null)

  // State to store container dimensions
  const [dimensions, setDimensions] = useState({width, height})

  // Fetch graph data
  const {data: graphData, isLoading} = useGraphData(ipId)
  console.log("graphData", graphData)

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const {clientWidth, clientHeight} = containerRef.current
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({
            width: clientWidth,
            height: clientHeight,
          })
        }
      }
    }

    // Initial update
    updateDimensions()

    // Set up resize observer for more accurate size tracking
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0].contentRect) {
        const {width, height} = entries[0].contentRect
        if (width > 0 && height > 0) {
          setDimensions({width, height})
        }
      } else {
        updateDimensions()
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Also listen for window resize events for better responsiveness
    window.addEventListener("resize", updateDimensions)

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  if (isLoading || !graphData) {
    return (
      <div
        ref={containerRef}
        className={`absolute inset-0 bg-background/5 rounded-md border border-border/50 ${className}`}
        style={{position: "absolute", width: "100%", height: "100%"}}
      >
        <div className='flex items-center justify-center h-full w-full'>
          <div className='animate-pulse text-sm text-textMuted'>
            Loading graph preview...
          </div>
        </div>
      </div>
    )
  }

  // If no data or empty data, show placeholder
  if (!graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`absolute inset-0 bg-background/5 rounded-md border border-border/50 flex items-center justify-center ${className}`}
        style={{position: "absolute", width: "100%", height: "100%"}}
      >
        <div className='text-sm text-textMuted'>
          No relationship data available
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 bg-background/5 rounded-md border border-border/50 overflow-hidden ${className}`}
      style={{position: "absolute", width: "100%", height: "100%"}}
    >
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor='rgba(248, 250, 252, 0.1)'
        nodeColor={(node: GraphNode) =>
          getNodeColor(node, node.type === NodeType.ROOT)
        }
        linkColor={(link: GraphLink) => getLinkColor(link, false)}
        nodeRelSize={3}
        linkWidth={1}
        enableZoom={false}
        enablePanInteraction={false}
        enableNodeDrag={false}
        cooldownTime={5000}
        warmupTicks={50}
        cooldownTicks={50}
        onEngineStop={() => {
          // Once the graph layout stabilizes, disable the physics simulation
          // for better performance
          if (graphData.nodes.length > 0) {
            graphData.nodes.forEach(node => {
              // @ts-expect-error - Internal properties used by force-graph
              node.fx = node.x
              // @ts-expect-error - Internal properties used by force-graph
              node.fy = node.y
            })
          }
        }}
      />
      <div className='absolute bottom-2 right-2 text-xs text-textMuted bg-background/80 px-2 py-1 rounded'>
        {graphData.nodes.length}{" "}
        {graphData.nodes.length === 1 ? "node" : "nodes"}
      </div>
    </div>
  )
}

export default DerivativeGraphPreview
