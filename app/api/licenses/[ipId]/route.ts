import { NextRequest, NextResponse } from "next/server";
import { getIPLicensesFromStory } from "@/lib/licenses";
import { DetailedLicenseTerms, OffchainTerms } from "@/types/license";

// Set cache control headers for 15 minutes
export const revalidate = 900; // 15 minutes in seconds

// Helper function to convert GitHub URLs to raw format if needed
function convertToRawGitHubUrl(url: string): string {
  // Check if it's a GitHub repository URL that needs conversion
  if (url.includes("github.com") && url.includes("/blob/")) {
    // Replace 'github.com' with 'raw.githubusercontent.com' and remove '/blob'
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }
  return url;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ipId: string }> }
) {
  // Await params before using its properties
  const resolvedParams = await params;
  const ipId = resolvedParams.ipId;

  try {
    // Fetch licenses from Story Protocol API
    const licenses = await getIPLicensesFromStory(ipId);

    if (!licenses || licenses.length === 0) {
      // No licenses found, return empty array with 200 status
      return NextResponse.json([], { status: 200 });
    }

    // Filter out disabled licenses
    const activeLicenses = licenses.filter((license) => !license.disabled);

    // Fetch off-chain terms for each license with a URI
    const enhancedLicenses = await Promise.all(
      activeLicenses.map(async (license: DetailedLicenseTerms) => {
        if (license.terms.uri) {
          try {
            // Convert GitHub URLs to raw format if needed
            const fetchUrl = convertToRawGitHubUrl(license.terms.uri);

            // Fetch the off-chain terms from the license URI
            const response = await fetch(fetchUrl);
            console.log(`Fetching off-chain terms from: ${fetchUrl}`);

            if (response.ok) {
              const offchainTerms = await response.json();
              // Return license with off-chain terms attached
              return {
                ...license,
                offchainTerms: offchainTerms as OffchainTerms,
              };
            }
          } catch (error) {
            console.error(
              `Failed to fetch off-chain terms for license ${license.id}:`,
              error
            );
          }
        }

        // Return license without off-chain terms if fetch failed or no URI
        return license;
      })
    );

    return NextResponse.json(enhancedLicenses);
  } catch (error) {
    console.error("Error fetching licenses from Story:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses from Story Protocol" },
      { status: 500 }
    );
  }
}
