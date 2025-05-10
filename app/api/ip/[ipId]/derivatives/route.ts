import { NextRequest, NextResponse } from 'next/server';
import {
  DerivativeRelationsResponse,
  IPNode,
  IPRelationship,
  RelationshipType,
  ApprovalStatus,
  RemixType,
  VerificationStatus,
  RoyaltyType
} from '@/types/graph';

// Set cache control headers for 5 minutes
export const revalidate = 300; // 5 minutes in seconds

/**
 * Helper function to transform IPFS URLs
 */
function transformIpfsUrl(url: string): string {
  if (!url) return url;
  // Convert ipfs:// to https://ipfs.io/ipfs/
  return url.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${url.substring(7)}`
    : url;
}

/**
 * API route handler for fetching derivative relationships for an IP asset
 * 
 * This endpoint integrates with the Story Protocol API to fetch relationship data
 * between IP assets, including ancestors, derivatives, and related IPs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ipId: string }> }
) {
  const resolvedParams = await params;
  const ipId = resolvedParams.ipId;
  const origin = request.nextUrl.origin;
  
  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const maxDepth = parseInt(searchParams.get('maxDepth') || '2', 10);
  const includeDisputes = searchParams.get('includeDisputes') === 'true';
  const includeSiblings = searchParams.get('includeSiblings') === 'true';
  
  try {
    // Step 1: Fetch the root IP asset data
    console.log(`Fetching root IP asset data for ${ipId}`);
    let rootAsset;
    
    try {
      const assetResponse = await fetch(
        `${origin}/api/ip/${ipId}`,
        { next: { revalidate } }
      );
      
      if (!assetResponse.ok) {
        throw new Error(`Failed to fetch root IP: ${assetResponse.statusText}`);
      }
      
      rootAsset = await assetResponse.json();
    } catch (error) {
      console.error(`Error fetching root IP ${ipId}:`, error);
      return NextResponse.json(
        { error: `Failed to fetch root IP ${ipId}` },
        { status: 404 }
      );
    }
    
    // Step 2: Initialize the response structure
    const response: DerivativeRelationsResponse = {
      root: {
        ipId,
        title: rootAsset.title || 'Unknown IP',
        description: rootAsset.description,
        image: rootAsset.image,
        mediaUrl: rootAsset.mediaUrl,
        mediaType: rootAsset.mediaType,
        createdAt: rootAsset.createdAt,
        creators: rootAsset.creators?.map(creator => ({
          address: creator.address,
          name: creator.name
        })),
        tags: [],
        metadata: {}
      },
      ancestors: [],
      derivatives: [],
      related: [],
      metadata: {
        totalRelationships: 0,
        directRelationships: 0,
        indirectRelationships: 0,
        updatedAt: new Date().toISOString()
      }
    };
    
    // Step 3: Fetch relationship data from Story Protocol API
    // In a production environment, this would call the Story Protocol API
    
    // For development purposes, we're using mock data
    // This will be replaced with actual API calls in production
    
    console.log(`Fetching relationships for ${ipId} (mock data for development)`);
    
    // Add ancestor relationships (IPs that this IP derives from)
    response.ancestors = [
      createMockIPRelationship(
        ipId, 
        'ancestor1', 
        'Original IP Asset 1', 
        'This is the original IP that the current asset is derived from.',
        RelationshipType.ADAPTATION,
        'outbound',
        ApprovalStatus.APPROVED,
        1
      ),
      createMockIPRelationship(
        ipId,
        'ancestor2',
        'Original IP Asset 2',
        'Another source IP that inspired this asset.',
        RelationshipType.INSPIRATION,
        'outbound',
        ApprovalStatus.AUTO_APPROVED,
        1
      )
    ];
    
    // Add derivative relationships (IPs derived from this IP)
    response.derivatives = [
      createMockIPRelationship(
        ipId,
        'derivative1',
        'Derivative IP Asset 1',
        'A derivative work based on this IP asset.',
        RelationshipType.REMIX,
        'inbound',
        ApprovalStatus.APPROVED,
        1,
        RemixType.VISUAL
      ),
      createMockIPRelationship(
        ipId,
        'derivative2',
        'Derivative IP Asset 2',
        'Another work that builds upon this IP asset.',
        RelationshipType.SEQUEL,
        'inbound',
        ApprovalStatus.PENDING,
        1
      ),
      createMockIPRelationship(
        ipId,
        'derivative3',
        'Derivative IP Asset 3',
        'A third work derived from this IP.',
        RelationshipType.ADAPTATION,
        'inbound',
        ApprovalStatus.APPROVED,
        1,
        RemixType.MIXED_MEDIA
      )
    ];
    
    // Add related relationships (siblings, collaborations, etc)
    if (includeSiblings) {
      response.related = [
        createMockIPRelationship(
          ipId,
          'related1',
          'Related IP Asset 1',
          'An IP that shares a common ancestor with this IP.',
          RelationshipType.REFERENCE,
          'bidirectional',
          ApprovalStatus.NOT_REQUIRED,
          2
        )
      ];
    }
    
    // Add disputed relationships if requested
    if (includeDisputes) {
      response.disputed = [
        createMockIPRelationship(
          ipId,
          'disputed1',
          'Disputed IP Asset',
          'An IP with a disputed relationship to this IP.',
          RelationshipType.ADAPTATION,
          'inbound',
          ApprovalStatus.REJECTED,
          1,
          undefined,
          VerificationStatus.DISPUTED
        )
      ];
    }
    
    // Update metadata
    response.metadata = {
      totalRelationships: 
        response.ancestors.length + 
        response.derivatives.length + 
        response.related.length + 
        (response.disputed?.length || 0),
      directRelationships: 
        response.ancestors.length + 
        response.derivatives.length,
      indirectRelationships: 
        response.related.length + 
        (response.disputed?.length || 0),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching derivative relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch derivative relationships' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create a mock IP relationship for development
 */
function createMockIPRelationship(
  rootIpId: string,
  ipId: string,
  title: string,
  description: string,
  relationshipType: RelationshipType,
  direction: 'inbound' | 'outbound' | 'bidirectional',
  approvalStatus: ApprovalStatus,
  distance: number,
  remixType?: RemixType,
  verificationStatus: VerificationStatus = VerificationStatus.VERIFIED
): IPRelationship {
  // For demo purposes, create a predictable but unique ID for each relationship
  // In production, this would be a real relationship ID from the blockchain
  const relationshipId = `rel_${rootIpId.substring(0, 6)}_${ipId}_${relationshipType}`;
  
  // Generate a random timestamp in the last year
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const randomTimestamp = new Date(
    oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime())
  ).toISOString();
  
  return {
    ipId: `0x${ipId.padEnd(40, '0')}`,
    title,
    description,
    image: `https://picsum.photos/seed/${ipId}/200`,
    relationshipType,
    relationshipId,
    direction,
    approvalStatus,
    createdAt: randomTimestamp,
    remixType,
    verificationStatus,
    distance,
    royaltyInfo: {
      type: RoyaltyType.PERCENTAGE,
      percentage: 5,
      token: 'ETH',
      paid: Math.random() > 0.5
    },
    metadata: {
      tags: generateRandomTags(),
      attributions: []
    }
  };
}

/**
 * Helper function to generate random tags for mock data
 */
function generateRandomTags(): string[] {
  const allTags = [
    'art', 'music', 'video', 'text', 'article', 'story', 'poem', 'song',
    'animation', 'game', 'photo', 'design', 'code', 'documentary', 
    'nft', 'digital', 'physical', 'remix', 'original', 'adaptation'
  ];
  
  // Pick 2-5 random tags
  const count = 2 + Math.floor(Math.random() * 4);
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * allTags.length);
    const tag = allTags[randomIndex];
    
    if (!result.includes(tag)) {
      result.push(tag);
    }
  }
  
  return result;
}