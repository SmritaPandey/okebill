import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = "OkeBill — Simple | Hisab | Accurate",
  description = "India's all-in-one e-billing platform. GST invoices, e-invoicing, e-way bills, digital signatures — all automated.",
  keywords = "GST billing software, e-invoicing India, e-way bill generator, digital signatures, inventory management, POS software India",
  canonical = "https://okebill.com",
  ogTitle,
  ogDescription,
  ogImage = "/logo-full.png",
  ogType = "website",
  twitterCard = "summary_large_image",
  structuredData,
}) => {
  const siteTitle = title.includes("OkeBill") ? title : `${title} | OkeBill`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={ogTitle || siteTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle || siteTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
