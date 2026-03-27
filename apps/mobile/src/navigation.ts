export type RootStackParamList = {
  Tabs: undefined;
  Posts:
    | {
        title?: string;
        categorySlug?: string;
        tagSlug?: string;
      }
    | undefined;
  PostDetail: {
    slug: string;
  };
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Notifications: undefined;
  Saved: undefined;
  Profile: undefined;
};
