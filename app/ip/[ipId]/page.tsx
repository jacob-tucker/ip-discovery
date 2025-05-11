"use client"

import {useQuery} from "@tanstack/react-query"
import {notFound} from "next/navigation"
import React, {use} from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  FileText,
  Calendar,
  User,
  Tag as TagIcon,
  Link as LinkIcon,
  ExternalLink,
  Clock,
  Image as ImageIcon,
  Network,
  ArrowRight,
} from "lucide-react"
import Header from "@/components/Header"
import IPDetails from "@/components/IPDetails"
import IPStats from "@/components/IPStats"
import IPLicenses from "@/components/IPLicenses"
import IPRoyalties from "@/components/IPRoyalties"
import Footer from "@/components/Footer"
import {getStoryIPAssetById} from "@/lib/data"
import MediaRenderer from "@/components/MediaRenderer"
import AudioPlayer from "@/components/AudioPlayer"

interface IPPageProps {
  params: Promise<{
    ipId: string
  }>
}

// Skeleton animation class for loading states
const skeletonClass = "animate-pulse bg-gray-200 rounded"

export default function IPPage({params}: IPPageProps) {
  const unwrappedParams = use(params)
  const decodedIpId = decodeURIComponent(unwrappedParams.ipId)

  const {
    data: ip,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ipAsset", decodedIpId],
    queryFn: () => getStoryIPAssetById(decodedIpId),
  })

  console.log("ip", ip)

  if (isLoading) {
    return (
      <div className='min-h-screen flex flex-col bg-background'>
        <Header />
        <div className='container py-4 flex-grow'>
          {/* Skeleton for the main IP card */}
          <div className='bg-cardBg rounded-md border border-border overflow-hidden mb-4'>
            <div className='flex flex-col md:flex-row'>
              {/* Skeleton for the media */}
              <div className='relative md:w-1/4 lg:w-1/5 md:border-r border-border'>
                <div className='aspect-square relative overflow-hidden'>
                  <div className={`${skeletonClass} h-full w-full`}>
                    <ImageIcon className='h-8 w-8 text-gray-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' />
                  </div>
                </div>
              </div>

              {/* Skeleton for the IP details */}
              <div className='flex-1 p-4'>
                <div>
                  <div className='flex justify-between items-start'>
                    <div className={`${skeletonClass} h-7 w-48 mb-2`}></div>
                  </div>
                  <div
                    className={`${skeletonClass} h-4 w-full max-w-2xl mb-2`}
                  ></div>
                  <div
                    className={`${skeletonClass} h-4 w-5/6 max-w-2xl mb-4`}
                  ></div>
                </div>

                {/* Skeleton for IP Stats */}
                <div className='grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4'>
                  {[1, 2, 3].map(group => (
                    <div key={group} className='bg-background rounded-md p-2'>
                      <div className={`${skeletonClass} h-3 w-16 mb-2`}></div>
                      <div className='space-y-2'>
                        {[1, 2].map(stat => (
                          <div
                            key={stat}
                            className='flex items-center justify-between'
                          >
                            <div className='flex items-center'>
                              <div
                                className={`${skeletonClass} h-3 w-3 mr-1.5 md:mr-2 rounded-full`}
                              ></div>
                              <div
                                className={`${skeletonClass} h-3 w-14`}
                              ></div>
                            </div>
                            <div className={`${skeletonClass} h-3 w-8`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton for the bottom sections */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='md:col-span-1'>
              {/* Skeleton for IP Details */}
              <div className='bg-cardBg rounded-md border border-border mb-4'>
                <div className='p-3 border-b border-border'>
                  <div className={`${skeletonClass} h-4 w-24 mb-1`}></div>
                </div>
                <div className='p-3'>
                  {[1, 2].map(item => (
                    <div key={item} className='mb-3'>
                      <div
                        className={`${skeletonClass} h-16 w-full rounded-md mb-2`}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton for Royalties */}
              <div className='bg-cardBg rounded-md border border-border'>
                <div className='p-3 border-b border-border'>
                  <div className={`${skeletonClass} h-4 w-32 mb-1`}></div>
                </div>
                <div className='p-2'>
                  {[1, 2, 3].map(item => (
                    <div
                      key={item}
                      className='bg-background rounded-md p-2 mb-2'
                    >
                      <div className={`${skeletonClass} h-4 w-full mb-2`}></div>
                      <div className={`${skeletonClass} h-3 w-2/3 mb-1`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skeleton for Licenses */}
            <div className='md:col-span-2'>
              <div className='bg-cardBg rounded-md border border-border'>
                <div className='p-3 border-b border-border'>
                  <div className={`${skeletonClass} h-4 w-36 mb-1`}></div>
                  <div className={`${skeletonClass} h-3 w-48`}></div>
                </div>
                <div className='p-2'>
                  {[1, 2].map(item => (
                    <div
                      key={item}
                      className='border border-border rounded-md mb-2 overflow-hidden'
                    >
                      <div className='p-2 bg-background'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center'>
                            <div
                              className={`${skeletonClass} h-4 w-4 rounded-full mr-2`}
                            ></div>
                            <div>
                              <div
                                className={`${skeletonClass} h-3 w-24 mb-1`}
                              ></div>
                              <div
                                className={`${skeletonClass} h-2 w-36`}
                              ></div>
                            </div>
                          </div>
                          <div
                            className={`${skeletonClass} h-6 w-16 rounded-full`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !ip) {
    notFound()
  }

  const isAudio = ip.mediaType.startsWith("audio/")

  return (
    <div className='min-h-screen flex flex-col bg-background'>
      <Header />
      <div className='flex-grow'>
        <div className='container py-4'>
          <div className='bg-cardBg rounded-md border border-border overflow-hidden mb-4'>
            <div className='flex flex-col md:flex-row'>
              <div className='relative md:w-1/4 lg:w-1/5 md:border-r border-border'>
                <div
                  className={`${isAudio ? "md:h-full" : "aspect-square"} relative overflow-hidden`}
                >
                  <MediaRenderer
                    mediaUrl={ip.mediaUrl}
                    mediaType={ip.mediaType}
                    title={ip.title}
                    fallbackImageUrl={ip.image}
                  />
                </div>

                {isAudio && (
                  <div className='p-3 block md:hidden'>
                    <AudioPlayer audioUrl={ip.mediaUrl} title={ip.title} />
                  </div>
                )}
              </div>

              <div className='flex-1 p-4'>
                <div>
                  <div className='flex justify-between items-start'>
                    <h1 className='text-xl font-bold'>{ip.title}</h1>
                    <Link
                      href={`/ip/${decodedIpId}/graph`}
                      className='p-2 rounded-full bg-accentPurple hover:bg-accentPurple/80 transition-colors'
                      title='View Derivative Graph'
                      aria-label='View Derivative Galaxy Graph'
                    >
                      <Network size={20} className='text-white' />
                    </Link>
                  </div>
                  <p className='text-xs text-textMuted mt-1 mb-4 max-w-2xl'>
                    {ip.description}
                  </p>
                </div>

                <IPStats ip={ip} />

                {isAudio && (
                  <div className='mt-4 max-w-md hidden md:block'>
                    <AudioPlayer audioUrl={ip.mediaUrl} title={ip.title} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='md:col-span-1'>
              <IPDetails ip={ip} />
              <div className='mt-4'>
                <IPRoyalties ip={ip} />
              </div>
            </div>

            <div className='md:col-span-2'>
              <IPLicenses ip={ip} />

              <div className='space-y-4'>
                {/* Derivative Galaxy Preview */}
                <div className='bg-cardBg rounded-md border border-border overflow-hidden'>
                  <div className='p-3 border-b border-border flex justify-between items-center'>
                    <h2 className='text-sm font-semibold'>Derivative Galaxy</h2>
                    <Link
                      href={`/ip/${decodedIpId}/graph`}
                      className='text-xs text-textMuted hover:text-textPrimary transition-colors flex items-center'
                    >
                      View full graph <ArrowRight className='h-3 w-3 ml-1' />
                    </Link>
                  </div>
                  <div className='p-3'>
                    <div className='h-[280px] w-full relative'>
                      {/* Lazy load the graph preview */}
                      <React.Suspense
                        fallback={
                          <div className='h-full w-full flex items-center justify-center'>
                            <div className='animate-pulse text-sm text-textMuted'>
                              Loading graph preview...
                            </div>
                          </div>
                        }
                      >
                        {typeof window !== "undefined" &&
                          (() => {
                            const GraphPreview = dynamic(
                              () =>
                                import(
                                  "@/components/IPGraph/DerivativeGraphPreview"
                                ),
                              {
                                ssr: false,
                                loading: () => (
                                  <div className='h-full w-full flex items-center justify-center'>
                                    <div className='animate-pulse text-sm text-textMuted'>
                                      Loading graph preview...
                                    </div>
                                  </div>
                                ),
                              }
                            )
                            return (
                              <GraphPreview
                                ipId={decodedIpId}
                                className='w-full h-full'
                              />
                            )
                          })()}
                      </React.Suspense>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
