/**
 * LinkBuild — Reusable JSON-LD Schema Snippets
 * ==============================================
 * Use these templates to inject structured data into dynamically generated pages.
 * All schemas use https://linkbuild.store as the canonical domain.
 *
 * Usage:
 *   1. Import the desired schema template
 *   2. Replace placeholder values ({{PLACEHOLDER}}) with actual data
 *   3. Inject as <script type="application/ld+json"> into the <head>
 *
 * Schema Types Included:
 *   - Programmatic SEO Pages (niche, country, language)
 *   - Dedicated Marketplace Landing Pages
 *   - Public Website Listing Pages
 *   - SoftwareApplication (app dashboard)
 *   - FAQ Pages
 */

// ============================================================================
// 1. PROGRAMMATIC SEO PAGE SCHEMA
//    For dynamically generated pages like:
//    - /exchange/niche/{niche-name}
//    - /exchange/country/{country-name}
//    - /exchange/language/{language-code}
//    - /websites/{domain-slug}
// ============================================================================

/**
 * Niche-specific landing page
 * Example: /exchange/niche/health-fitness
 */
export const NicheListingSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "{{NICHE_NAME}} Backlink Exchange Partners | LinkBuild",
  "description": "Find verified {{NICHE_NAME}} websites for backlink exchange on LinkBuild. Connect with niche-relevant link partners, monitor backlinks, and grow your domain authority safely.",
  "url": "https://linkbuild.store/exchange/niche/{{NICHE_SLUG}}",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "about": {
    "@type": "Thing",
    "name": "{{NICHE_NAME}} Backlink Exchange",
    "description": "Verified {{NICHE_NAME}} websites available for white-hat backlink exchange partnerships on LinkBuild."
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "{{NICHE_NAME}} Link Partners",
    "numberOfItems": "{{PARTNER_COUNT}}",
    "itemListOrder": "https://schema.org/ItemListOrderDescending"
  }
};

/**
 * Country-specific landing page
 * Example: /exchange/country/united-states
 */
export const CountryListingSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Backlink Exchange in {{COUNTRY_NAME}} | LinkBuild",
  "description": "Find verified backlink exchange partners in {{COUNTRY_NAME}}. Connect with local websites, monitor backlinks, and grow your domain authority with country-specific link building.",
  "url": "https://linkbuild.store/exchange/country/{{COUNTRY_SLUG}}",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "about": {
    "@type": "Thing",
    "name": "Backlink Exchange in {{COUNTRY_NAME}}",
    "description": "Verified websites from {{COUNTRY_NAME}} available for white-hat backlink exchange on LinkBuild."
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "{{COUNTRY_NAME}} Link Partners",
    "numberOfItems": "{{PARTNER_COUNT}}",
    "itemListOrder": "https://schema.org/ItemListOrderDescending"
  }
};

/**
 * Language-specific landing page
 * Example: /exchange/language/spanish
 */
export const LanguageListingSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "{{LANGUAGE_NAME}} Backlink Exchange Partners | LinkBuild",
  "description": "Find verified {{LANGUAGE_NAME}}-language websites for backlink exchange. Connect with language-specific link partners, monitor backlinks, and grow multilingual domain authority.",
  "url": "https://linkbuild.store/exchange/language/{{LANGUAGE_SLUG}}",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "about": {
    "@type": "Thing",
    "name": "{{LANGUAGE_NAME}} Backlink Exchange",
    "description": "Verified {{LANGUAGE_NAME}}-language websites available for backlink exchange on LinkBuild."
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "{{LANGUAGE_NAME}} Link Partners",
    "numberOfItems": "{{PARTNER_COUNT}}",
    "itemListOrder": "https://schema.org/ItemListOrderDescending"
  }
};

/**
 * Individual website listing page
 * Example: /websites/example-com
 */
export const WebsiteProfileSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "{{DOMAIN_NAME}} — Backlink Exchange Profile | LinkBuild",
  "description": "{{DOMAIN_NAME}}: DA {{DA}}, {{NICHE}} website available for backlink exchange on LinkBuild. Verified {{COUNTRY}} domain with {{TRAFFIC}} monthly traffic.",
  "url": "https://linkbuild.store/websites/{{DOMAIN_SLUG}}",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "about": {
    "@type": "WebSite",
    "name": "{{DOMAIN_NAME}}",
    "url": "https://{{DOMAIN_NAME}}",
    "description": "{{DOMAIN_DESCRIPTION}}",
    "inLanguage": "{{LANGUAGE_CODE}}"
  }
};

// ============================================================================
// 2. DEDICATED MARKETPLACE LANDING PAGE SCHEMA
//    For marketplace pages like:
//    - /marketplace
//    - /marketplace/niche/{niche}
//    - /marketplace/high-da
// ============================================================================

/**
 * Main marketplace page
 * Example: /marketplace
 */
export const MarketplaceLandingSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Backlink Exchange Marketplace | LinkBuild",
  "description": "Browse the LinkBuild marketplace for verified backlink exchange partners. Filter by niche, country, domain authority, and language to find perfect link building opportunities.",
  "url": "https://linkbuild.store/marketplace",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "Available Backlink Exchange Partners",
    "description": "Verified domains available for white-hat backlink exchange on LinkBuild",
    "numberOfItems": "{{TOTAL_LISTINGS}}",
    "itemListOrder": "https://schema.org/ItemListOrderDescending"
  },
  "specialty": "Backlink Exchange Marketplace"
};

/**
 * Marketplace filtered by DA tier
 * Example: /marketplace/high-da
 */
export const HighDAMarketplaceSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "High DA Backlink Exchange Partners (DA ≥ {{MIN_DA}}) | LinkBuild",
  "description": "Find high domain authority (DA ≥ {{MIN_DA}}) backlink exchange partners. Premium link building opportunities with verified, authoritative domains on LinkBuild.",
  "url": "https://linkbuild.store/marketplace/high-da",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "High DA Backlink Exchange Partners",
    "description": "Premium, verified high-domain-authority websites available for backlink exchange",
    "numberOfItems": "{{TOTAL_LISTINGS}}",
    "itemListOrder": "https://schema.org/ItemListOrderHighest"
  }
};

// ============================================================================
// 3. PUBLIC WEBSITE LISTING PAGES SCHEMA
//    For static informational pages:
//    - /about, /contact, /pricing, /blog/*
// ============================================================================

/**
 * Pricing page
 * Example: /pricing
 */
export const PricingPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "LinkBuild Pricing — Free, Pro & Agency Plans",
  "description": "Compare LinkBuild pricing plans: Free (basic backlink exchange), Pro ($49/mo — advanced matching & analytics), and Agency ($199/mo — unlimited websites, API access).",
  "url": "https://linkbuild.store/pricing",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "LinkBuild Plans",
    "numberOfItems": 3,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Product",
          "name": "LinkBuild Free",
          "description": "Basic backlink exchange for 1 website. Includes partner matching and basic monitoring.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Product",
          "name": "LinkBuild Pro",
          "description": "Advanced link building with priority matching, up to 10 websites, and detailed analytics.",
          "offers": {
            "@type": "Offer",
            "price": "49",
            "priceCurrency": "USD"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Product",
          "name": "LinkBuild Agency",
          "description": "Unlimited websites, white-label reports, API access, and dedicated support.",
          "offers": {
            "@type": "Offer",
            "price": "199",
            "priceCurrency": "USD"
          }
        }
      }
    ]
  }
};

/**
 * Blog post page
 * Example: /blog/how-to-exchange-backlinks-safely
 */
export const BlogPostSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{{BLOG_TITLE}}",
  "description": "{{BLOG_DESCRIPTION}}",
  "url": "https://linkbuild.store/blog/{{BLOG_SLUG}}",
  "datePublished": "{{PUBLISH_DATE}}",
  "dateModified": "{{MODIFIED_DATE}}",
  "author": {
    "@type": "Organization",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "publisher": {
    "@type": "Organization",
    "name": "LinkBuild",
    "url": "https://linkbuild.store",
    "logo": {
      "@type": "ImageObject",
      "url": "https://linkbuild.store/assets/logo.png"
    }
  },
  "image": "{{BLOG_IMAGE_URL}}",
  "isPartOf": {
    "@type": "Blog",
    "name": "LinkBuild SEO Blog",
    "url": "https://linkbuild.store/blog"
  }
};

/**
 * Contact page
 * Example: /contact
 */
export const ContactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact LinkBuild — Backlink Exchange Support",
  "description": "Get in touch with the LinkBuild team. Support for backlink exchange, account issues, billing questions, and partnership inquiries.",
  "url": "https://linkbuild.store/contact",
  "isPartOf": {
    "@type": "WebSite",
    "name": "LinkBuild",
    "url": "https://linkbuild.store"
  },
  "about": {
    "@type": "Organization",
    "name": "LinkBuild",
    "url": "https://linkbuild.store",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@linkbuild.store",
      "url": "https://linkbuild.store/contact"
    }
  }
};

// ============================================================================
// 4. FAQ PAGE SCHEMA (REUSABLE)
//    For dynamically generated FAQ sections
// ============================================================================

/**
 * FAQ page — pass questions/answers array dynamically
 * Example: /faq
 */
export const FAQPageSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

// ============================================================================
// 5. BREADCRUMB SCHEMA (REUSABLE)
//    Add to any page with hierarchical navigation
// ============================================================================

/**
 * BreadcrumbList schema
 * @param {Array<{name: string, url: string}>} items - Breadcrumb items from root to current page
 */
export const BreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

// ============================================================================
// 6. SEARCH ACTION SCHEMA
//    For the main website to enable sitelinks search box in Google
// ============================================================================

export const SitelinksSearchBoxSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "LinkBuild",
  "url": "https://linkbuild.store",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://linkbuild.store/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

// ============================================================================
// HELPER: Inject schema into HTML <head>
// ============================================================================

/**
 * Generates a <script type="application/ld+json"> HTML string
 * @param {Object} schema - The JSON-LD schema object
 * @returns {string} HTML script tag
 */
export function injectSchema(schema) {
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Combines multiple schemas into a single @graph structure (Google recommended for multiple schemas)
 * @param {Object[]} schemas - Array of JSON-LD schema objects
 * @returns {Object} Combined @graph schema
 */
export function combineSchemas(schemas) {
  return {
    "@context": "https://schema.org",
    "@graph": schemas
  };
}
