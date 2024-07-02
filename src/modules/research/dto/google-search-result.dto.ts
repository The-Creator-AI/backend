export interface GoogleSearchResult {
  kind: string;
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  pagemap: {
    cse_thumbnail: {
      src: string;
      width: string;
      height: string;
    }[];
    metatags: {
      og_image: string;
      og_image_width: string;
      og_image_alt: string;
      twitter_card: string;
      twitter_title: string;
      og_site_name: string;
      twitter_site_id: string;
      handheldfriendly: string;
      twitter_url: string;
      og_title: string;
      og_image_height: string;
      og_image_type: string;
      abstract: string;
      og_description: string;
      twitter_image: string;
      article_tag: string;
      twitter_site: string;
      news_keywords: string;
      viewport: string;
      twitter_description: string;
      mobileoptimized: string;
      og_url: string;
    };
    cse_image: {
      src: string;
    }[];
  };
}
