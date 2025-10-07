import { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const APP_NAME = 'Recall Notebook'
const APP_DESCRIPTION = 'AI-powered knowledge management that works the way you think. Save articles, PDFs, and notes—then search across everything with natural language.'

export const DEFAULT_OG_IMAGE = `${APP_URL}/og-image.png`

interface MetadataParams {
  title: string
  description: string
  keywords?: string[]
  path?: string
  noIndex?: boolean
  ogImage?: string
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  path = '',
  noIndex = false,
  ogImage = DEFAULT_OG_IMAGE,
}: MetadataParams): Metadata {
  const fullTitle = title === APP_NAME ? title : `${title} | ${APP_NAME}`
  const url = `${APP_URL}${path}`

  const defaultKeywords = [
    'knowledge management',
    'AI notes',
    'semantic search',
    'note taking',
    'second brain',
    'RAG',
    'research tool',
    'PDF organizer',
  ]

  return {
    title: fullTitle,
    description,
    keywords: [...defaultKeywords, ...keywords],
    authors: [{ name: APP_NAME }],
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: APP_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
    alternates: {
      canonical: url,
    },
  }
}
