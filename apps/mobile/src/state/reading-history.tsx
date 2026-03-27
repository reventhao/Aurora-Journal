import type { PostSummary } from '@aurora/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

const STORAGE_KEY = 'aurora-mobile-reading-history';
const MAX_ITEMS = 12;

type ReadingHistoryContextValue = {
  items: PostSummary[];
  loaded: boolean;
  track: (post: PostSummary) => void;
  clear: () => Promise<void>;
};

const ReadingHistoryContext = createContext<ReadingHistoryContextValue | null>(null);

function normalizePost(post: PostSummary): PostSummary {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    coverThumbUrl: post.coverThumbUrl,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    featured: post.featured,
    views: post.views,
    scheduledPublishAt: post.scheduledPublishAt,
    scheduledUnpublishAt: post.scheduledUnpublishAt,
    category: post.category,
    tags: post.tags,
  };
}

export function ReadingHistoryProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<PostSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) {
          return;
        }

        setItems(raw ? (JSON.parse(raw) as PostSummary[]) : []);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setItems([]);
      })
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value: ReadingHistoryContextValue = {
    items,
    loaded,
    track: (post) => {
      const next = normalizePost(post);
      setItems((current) => [next, ...current.filter((item) => item.id !== next.id)].slice(0, MAX_ITEMS));
    },
    clear: async () => {
      setItems([]);
      await AsyncStorage.removeItem(STORAGE_KEY);
    },
  };

  return <ReadingHistoryContext.Provider value={value}>{children}</ReadingHistoryContext.Provider>;
}

export function useReadingHistory() {
  const context = useContext(ReadingHistoryContext);
  if (!context) {
    throw new Error('useReadingHistory must be used within ReadingHistoryProvider');
  }

  return context;
}
