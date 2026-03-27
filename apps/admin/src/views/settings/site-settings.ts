import {
  buildDefaultNavigationMenu,
  type SiteSettings,
} from '@aurora/shared';

export function createDefaultSiteSettings(): SiteSettings {
  return {
    siteName: '',
    siteSubtitle: '',
    siteDescription: '',
    logo: '',
    announcementEnabled: false,
    announcementTitle: '',
    announcementContent: '',
    announcementLink: '',
    announcementLinkLabel: '',
    heroTitle: '',
    heroDescription: '',
    footerText: '',
    githubUrl: '',
    icp: '',
    aboutTitle: '',
    aboutContent: '',
    homeLayoutPreset: 'focus',
    navigationMenu: buildDefaultNavigationMenu(),
    homeSections: [],
  };
}
