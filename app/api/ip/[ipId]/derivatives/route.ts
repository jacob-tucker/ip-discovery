import { NextRequest, NextResponse } from 'next/server';
import { DerivativeRelationsResponse } from '@/types/graph';

// Set cache control headers for 5 minutes
export const revalidate = 300; // 5 minutes in seconds

/**
 * API route handler for fetching derivative relationships for an IP asset
 * This is a placeholder implementation that will be replaced with actual Story Protocol API integration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ipId: string }> }
) {
  const resolvedParams = await params;
  const ipId = resolvedParams.ipId;
  
  try {
    // This is a mock implementation
    // In production, this would make calls to the Story Protocol API
    
    // Basic mock data based on the provided IP ID
    const mockData: DerivativeRelationsResponse = {
      root: {
        ipId,
        title: `IP Asset ${ipId.substring(0, 6)}...`,
        image: `https://picsum.photos/seed/${ipId}/200`,
        metadata: {}
      },
      ancestors: [
        {
          ipId: `0x${Math.random().toString(16).substring(2, 42)}`,
          title: 'Ancestor IP 1',
          image: `https://picsum.photos/seed/ancestor1/200`,
          relationshipType: 'direct',
          metadata: {}
        },
        {
          ipId: `0x${Math.random().toString(16).substring(2, 42)}`,
          title: 'Ancestor IP 2',
          image: `https://picsum.photos/seed/ancestor2/200`,
          relationshipType: 'indirect',
          metadata: {}
        }
      ],
      derivatives: [
        {
          ipId: `0x${Math.random().toString(16).substring(2, 42)}`,
          title: 'Derivative IP 1',
          image: `https://picsum.photos/seed/derivative1/200`,
          relationshipType: 'direct',
          metadata: {}
        },
        {
          ipId: `0x${Math.random().toString(16).substring(2, 42)}`,
          title: 'Derivative IP 2', 
          image: `https://picsum.photos/seed/derivative2/200`,
          relationshipType: 'direct',
          metadata: {}
        },
        {
          ipId: `0x${Math.random().toString(16).substring(2, 42)}`,
          title: 'Derivative IP 3',
          image: `https://picsum.photos/seed/derivative3/200`,
          relationshipType: 'direct',
          metadata: {}
        }
      ],
      related: [
        {
          ipId: `0x${Math.random().toString(16).substring(2, 42)}`,
          title: 'Related IP 1',
          image: `https://picsum.photos/seed/related1/200`,
          relationshipType: 'sibling',
          metadata: {}
        }
      ]
    };

    // In a real implementation, we would fetch data from Story Protocol API
    // const response = await fetch(`https://api.storyapis.com/api/v3/assets/${ipId}/derivatives`, {
    //   headers: {
    //     'X-Api-Key': process.env.X_API_KEY,
    //     'X-Chain': process.env.X_CHAIN,
    //   },
    //   next: { revalidate },
    // });
    
    // For now, return the mock data
    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching derivative relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch derivative relationships' },
      { status: 500 }
    );
  }
}