import axios from "axios";
import NodeCache from "node-cache";
import { supabase, isSupabaseConfigured } from "../config/supabase";
import config from "../config/config";

const apiCache = new NodeCache({ stdTTL: config.cacheTtl });

interface ApiResource {
  title: string;
  description?: string;
  url?: string;
  duration?: string;
  difficulty?: string;
  source: string;
}

// YouTube API Service
export const searchYoutube = async (
  query: string,
  focusDomain: string,
  proficiency: string
): Promise<ApiResource[]> => {
  try {
    if (!config.youtubeApiKey) {
      console.warn("YouTube API key not configured");
      return [];
    }

    const cacheKey = `youtube_${focusDomain}_${proficiency}`;
    const cached = apiCache.get<ApiResource[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: query,
        maxResults: 5,
        key: config.youtubeApiKey,
        type: "video",
      },
      timeout: 5000,
    });

    const resources: ApiResource[] = response.data.items.map(
      (item: any) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        source: "youtube",
        difficulty: proficiency,
      })
    );

    apiCache.set(cacheKey, resources);

    // Save to cache table
    const cacheData = resources.map((resource) => ({
      focusDomain,
      proficiency,
      resourceType: "resource",
      sourceAPI: "youtube",
      title: resource.title,
      description: resource.description || null,
      url: resource.url || null,
      difficulty: resource.difficulty || null,
      expiresAt: new Date(Date.now() + config.cacheTtl * 1000).toISOString(),
    }));

    if (isSupabaseConfigured) {
      const { error: insertError } = await supabase
        .from("cached_resources")
        .insert(cacheData);

      if (insertError) {
        console.error("Error caching YouTube resources in Supabase:", insertError);
      }
    }

    return resources;
  } catch (error) {
    console.error("YouTube API error:", error);
    return [];
  }
};

// GitHub API Service
export const searchGithub = async (
  query: string,
  focusDomain: string,
  proficiency: string
): Promise<ApiResource[]> => {
  try {
    const cacheKey = `github_${focusDomain}_${proficiency}`;
    const cached = apiCache.get<ApiResource[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const searchQuery = `${query} roadmap in:readme language:markdown`;

    const response = await axios.get("https://api.github.com/search/repositories", {
      params: {
        q: searchQuery,
        sort: "stars",
        order: "desc",
        per_page: 5,
      },
      headers: config.githubToken ? { Authorization: `Bearer ${config.githubToken}` } : {},
      timeout: 5000,
    });

    const resources: ApiResource[] = response.data.items.map(
      (repo: any) => ({
        title: repo.name,
        description: repo.description,
        url: repo.html_url,
        source: "github",
        difficulty: proficiency,
      })
    );

    apiCache.set(cacheKey, resources);

    const cacheData = resources.map((resource) => ({
      focusDomain,
      proficiency,
      resourceType: "resource",
      sourceAPI: "github",
      title: resource.title,
      description: resource.description || null,
      url: resource.url || null,
      difficulty: resource.difficulty || null,
      expiresAt: new Date(Date.now() + config.cacheTtl * 1000).toISOString(),
    }));

    if (isSupabaseConfigured) {
      const { error: insertError } = await supabase
        .from("cached_resources")
        .insert(cacheData);

      if (insertError) {
        console.error("Error caching GitHub resources in Supabase:", insertError);
      }
    }

    return resources;
  } catch (error) {
    console.error("GitHub API error:", error);
    return [];
  }
};

// Dev.to API Service
export const searchDevto = async (
  query: string,
  focusDomain: string,
  proficiency: string
): Promise<ApiResource[]> => {
  try {
    const cacheKey = `devto_${focusDomain}_${proficiency}`;
    const cached = apiCache.get<ApiResource[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await axios.get("https://dev.to/api/articles", {
      params: {
        tag: query.toLowerCase(),
        per_page: 5,
      },
      timeout: 5000,
    });

    const resources: ApiResource[] = response.data.map(
      (article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: "devto",
        difficulty: proficiency,
      })
    );

    apiCache.set(cacheKey, resources);

    const cacheData = resources.map((resource) => ({
      focusDomain,
      proficiency,
      resourceType: "resource",
      sourceAPI: "devto",
      title: resource.title,
      description: resource.description || null,
      url: resource.url || null,
      difficulty: resource.difficulty || null,
      expiresAt: new Date(Date.now() + config.cacheTtl * 1000).toISOString(),
    }));

    if (isSupabaseConfigured) {
      const { error: insertError } = await supabase
        .from("cached_resources")
        .insert(cacheData);

      if (insertError) {
        console.error("Error caching Dev.to resources in Supabase:", insertError);
      }
    }

    return resources;
  } catch (error) {
    console.error("Dev.to API error:", error);
    return [];
  }
};

// Coursera Public API (via Wikipedia/Coursera glossary)
export const searchCoursera = async (
  query: string,
  focusDomain: string,
  proficiency: string
): Promise<ApiResource[]> => {
  try {
    const cacheKey = `coursera_${focusDomain}_${proficiency}`;
    const cached = apiCache.get<ApiResource[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // Using Wikipedia MediaWiki API as fallback for glossary/definitions
    const response = await axios.get("https://en.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        format: "json",
        list: "search",
        srsearch: query,
        srwhat: "nearmatch",
        srprop: "snippet",
        srlimit: 5,
      },
      timeout: 5000,
    });

    const resources: ApiResource[] = response.data.query.search.map(
      (result: any) => ({
        title: result.title,
        description: result.snippet.replace(/<\/?[^>]+(>|$)/g, ""), // Remove HTML tags
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
        source: "coursera",
        difficulty: proficiency,
      })
    );

    apiCache.set(cacheKey, resources);

    const cacheData = resources.map((resource) => ({
      focusDomain,
      proficiency,
      resourceType: "resource",
      sourceAPI: "coursera",
      title: resource.title,
      description: resource.description || null,
      url: resource.url || null,
      difficulty: resource.difficulty || null,
      expiresAt: new Date(Date.now() + config.cacheTtl * 1000).toISOString(),
    }));

    if (isSupabaseConfigured) {
      const { error: insertError } = await supabase
        .from("cached_resources")
        .insert(cacheData);

      if (insertError) {
        console.error("Error caching Coursera resources in Supabase:", insertError);
      }
    }

    return resources;
  } catch (error) {
    console.error("Coursera/Wikipedia API error:", error);
    return [];
  }
};

// Get search query based on focus domain and proficiency, aligned with the curriculum topics
const getSearchQuery = (focusDomain: string, proficiency: string): string => {
  const queryMap: Record<string, Record<string, string>> = {
    Frontend: {
      Beginner: "HTML5 CSS3 JavaScript DOM tutorial",
      Intermediate: "React Router Tailwind CSS TypeScript course",
      Advanced: "Next.js App Router Web Performance Micro-Frontends guide",
    },
    Backend: {
      Beginner: "Node.js Express REST API SQL basics",
      Intermediate: "Spring Boot PostgreSQL Redis Caching tutorial",
      Advanced: "Distributed Systems Docker Kubernetes Go Concurrency architect",
    },
    Mobile: {
      Beginner: "React Native Expo Navigation UI basics",
      Intermediate: "React Native camera GPS state management tutorial",
      Advanced: "SwiftUI Kotlin Native Bridges performance tuning guide",
    },
    AI: {
      Beginner: "Python Pandas NumPy Statistics tutorial",
      Intermediate: "Neural Networks PyTorch NLP Recharts course",
      Advanced: "Transformer LLM Generative AI MLOps tutorial",
    },
  };

  return queryMap[focusDomain]?.[proficiency] || `${focusDomain} ${proficiency} course tutorial`;
};

// Aggregate all APIs and return combined results
export const aggregateRecommendations = async (
  focusDomain: string,
  proficiency: string
): Promise<ApiResource[]> => {
  try {
    const query = getSearchQuery(focusDomain, proficiency);

    const [youtube, github, devto, coursera] = await Promise.allSettled([
      searchYoutube(query, focusDomain, proficiency),
      searchGithub(query, focusDomain, proficiency),
      searchDevto(query, focusDomain, proficiency),
      searchCoursera(query, focusDomain, proficiency),
    ]);

    const allResources: ApiResource[] = [];

    if (youtube.status === "fulfilled") {
      allResources.push(...youtube.value);
    }
    if (github.status === "fulfilled") {
      allResources.push(...github.value);
    }
    if (devto.status === "fulfilled") {
      allResources.push(...devto.value);
    }
    if (coursera.status === "fulfilled") {
      allResources.push(...coursera.value);
    }

    // Remove duplicates and limit
    const uniqueResources = Array.from(
      new Map(allResources.map((r) => [r.title, r])).values()
    ).slice(0, config.maxRecommendations);

    return uniqueResources;
  } catch (error) {
    console.error("Error aggregating recommendations:", error);
    return [];
  }
};

// Get cached resources if available, fallback to aggregated APIs
export const getRecommendedResources = async (
  focusDomain: string,
  proficiency: string
): Promise<ApiResource[]> => {
  try {
    // Check for cached resources
    if (isSupabaseConfigured) {
      const { data: cachedResources, error } = await supabase
        .from("cached_resources")
        .select("*")
        .eq("focusDomain", focusDomain)
        .eq("proficiency", proficiency)
        .gt("expiresAt", new Date().toISOString())
        .limit(config.maxRecommendations);

      if (error) {
        console.error("Error fetching cached resources from Supabase:", error);
      } else if (cachedResources && cachedResources.length > 0) {
        return cachedResources.map((r: any) => ({
          title: r.title,
          description: r.description || undefined,
          url: r.url || undefined,
          difficulty: r.difficulty || undefined,
          source: r.sourceAPI,
        }));
      }
    }

    // Fallback to API aggregation
    return await aggregateRecommendations(focusDomain, proficiency);
  } catch (error) {
    console.error("Error getting recommended resources:", error);
    return [];
  }
};
