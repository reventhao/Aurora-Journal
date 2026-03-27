import type { PostSummary } from '@aurora/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

const STORAGE_KEY = 'aurora-mobile-reading-list';

type ReadingListContextValue = {
  items: PostSummary[];
  loaded: boolean;
  has: (postId: string) => boolean;
  toggle: (post: PostSummary) => boolean;
};

const ReadingListContext = createContext<ReadingListContextValue | null>(null);

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

export function ReadingListProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<PostSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        setItems(raw ? (JSON.parse(raw) as PostSummary[]) : []);
      })
      .catch(() => {
        if (!active) return;
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
    if (!loaded) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value: ReadingListContextValue = {
    items,
    loaded,
    has: (postId) => items.some((item) => item.id === postId),
    toggle: (post) => {
      const exists = items.some((item) => item.id === post.id);
      setItems((current) =>
        exists ? current.filter((item) => item.id !== post.id) : [normalizePost(post), ...current],
      );
      return !exists;
    },
  };

  return <ReadingListContext.Provider value={value}>{children}</ReadingListContext.Provider>;
}

export function useReadingList() {
  const context = useContext(ReadingListContext);
  if (!context) {
    throw new Error('useReadingList must be used within ReadingListProvider');
  }

  return context;
}
