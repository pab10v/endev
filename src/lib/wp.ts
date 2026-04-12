const WP_URL = 'https://coury.endev.us';
const API_URL = `${WP_URL}/wp-json`;

export interface Post {
  id: number;
  date: string;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
  };
}

export interface SiteInfo {
  name: string;
  description: string;
  url: string;
  logo?: string;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

export async function getSiteInfo(): Promise<SiteInfo> {
  try {
    const res = await fetchWithRetry(`${API_URL}/`);
    const data = await res.json();
    return {
      name: data.name || 'ENDEV',
      description: data.description || 'Resilient Digital Ecosystems',
      url: data.url,
      logo: `https://coury.endev.us/wp-content/uploads/logo.png`
    };
  } catch (e) {
    console.warn('Fallback metadata used due to fetch failure');
    return {
      name: 'ENDEV',
      description: 'Resilient Digital Ecosystems',
      url: WP_URL,
    };
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetchWithRetry(`${API_URL}/wp/v2/posts?_embed&per_page=10`);
    return res.json();
  } catch (e) {
    console.error('Failed to fetch posts:', e);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const res = await fetchWithRetry(`${API_URL}/wp/v2/posts?slug=${slug}&_embed`);
    const posts = await res.json();
    return posts[0] || null;
  } catch (e) {
    return null;
  }
}
