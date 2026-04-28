/// <reference types="vite/client" />
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'ANIWAVE';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5000';
const DEFAULT_IMAGE = 'https://image.tmdb.org/t/p/w300/www2cojYhhUNBvQFECEKC8Fh.jpg';
const DEFAULT_DESC = 'Watch anime online free in HD on ANIWAVE. Stream subbed and dubbed anime. Trending, seasonal, and top-rated anime powered by AniList.';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'video.other' | 'article';
  noIndex?: boolean;
  canonical?: string;
  jsonLd?: object | object[];
  prev?: string;
  next?: string;
  keywords?: string;
  locale?: string;
}

export default function SEOHead({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  canonical,
  jsonLd,
  prev,
  next,
  keywords,
  locale = 'en_US',
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const canonicalUrl = canonical || fullUrl;
  const fullImage = image?.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonicalUrl} />
      {prev && <link rel="prev" href={prev} />}
      {next && <link rel="next" href={next} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:locale" content={locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}
        </script>
      )}
    </Helmet>
  );
}
