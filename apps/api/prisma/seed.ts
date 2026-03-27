import { PrismaClient, PostStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { extraCategoriesSeed, extraCommentsSeed, extraPostsSeed, extraTagsSeed } from './long-content.seed';
import { PERMISSION_DEFINITIONS, SYSTEM_ROLE_TEMPLATES } from '../src/common/auth/permissions';

const prisma = new PrismaClient();

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
};

type SeedTag = {
  name: string;
  slug: string;
  color: string;
};

type SeedPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  readingTime: number;
  views: number;
  featured?: boolean;
  publishedAt: string;
  categorySlug: string;
  tagSlugs: string[];
};

const categoriesSeed: SeedCategory[] = [
  {
    name: '工程实践',
    slug: 'engineering',
    description: '围绕架构、性能、稳定性与团队协作的工程方法。',
  },
  {
    name: '前端体验',
    slug: 'frontend-experience',
    description: '从交互、组件、可访问性到浏览器性能的前端专题。',
  },
  {
    name: '产品设计',
    slug: 'product-design',
    description: '记录信息结构、产品策略、内容系统与设计思考。',
  },
  {
    name: 'AI 与效率',
    slug: 'ai-productivity',
    description: '关注 AI 工作流、自动化协作与个人生产力提升。',
  },
  {
    name: '内容运营',
    slug: 'content-ops',
    description: '关于写作流程、内容体系、SEO 与发布策略的实践。',
  },
];

categoriesSeed.push(...extraCategoriesSeed);

const tagsSeed: SeedTag[] = [
  { name: 'Vue 3', slug: 'vue3', color: '#0ea5a4' },
  { name: 'NestJS', slug: 'nestjs', color: '#ef4444' },
  { name: 'TypeScript', slug: 'typescript', color: '#2563eb' },
  { name: 'PostgreSQL', slug: 'postgresql', color: '#0f766e' },
  { name: 'Prisma', slug: 'prisma', color: '#6366f1' },
  { name: 'Arco Design', slug: 'arco-design', color: '#3b82f6' },
  { name: '内容策略', slug: 'content-strategy', color: '#f59e0b' },
  { name: 'SEO', slug: 'seo', color: '#84cc16' },
  { name: '性能优化', slug: 'performance', color: '#06b6d4' },
  { name: '设计系统', slug: 'design-system', color: '#8b5cf6' },
  { name: 'AI 工作流', slug: 'ai-workflow', color: '#ec4899' },
  { name: '团队协作', slug: 'team-collaboration', color: '#f97316' },
];

tagsSeed.push(...extraTagsSeed);

const postsSeed: SeedPost[] = [
  {
    title: '把博客后台做成真正可运营的内容系统',
    slug: 'build-operable-content-platform',
    excerpt:
      '不是把文章、标签、评论分别做个 CRUD 就结束了，真正可运营的后台要解决内容组织、协作效率、发布节奏与长期维护。',
    coverImage:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '把博客后台做成真正可运营的内容系统',
    seoDescription:
      '从内容结构、媒体组织、协作权限到发布流程，系统梳理一套可长期使用的博客后台设计方案。',
    readingTime: 8,
    views: 1280,
    featured: true,
    publishedAt: '2026-03-10T09:00:00.000Z',
    categorySlug: 'content-ops',
    tagSlugs: ['content-strategy', 'seo', 'team-collaboration'],
    content: `# 把博客后台做成真正可运营的内容系统

多数博客后台的问题，并不是功能少，而是功能之间没有形成闭环。

编辑器、媒体库、分类标签、评论管理、权限系统如果彼此割裂，团队在真实使用时就会不断遇到这些问题：

- 素材找不到，重复上传越来越多
- 文章状态混乱，草稿与发布节奏脱节
- 权限只有“能不能进页面”，没有落实到动作级别
- 评论处理没有反馈链路，审核和运营体验很差

## 一套可运营后台，至少要覆盖四个层面

### 1. 内容结构稳定

内容模型要足够简单，但不能简陋。

文章需要有：

- 标题、摘要、正文
- 分类、标签
- 封面、SEO 信息
- 发布时间与状态
- 修订记录

这些字段看起来普通，但它们决定了前台展示、检索、推荐、归档和运营分析是否能成立。

### 2. 媒体资产可复用

媒体库绝不能只是“上传图片的地方”。

更合理的方向是：

- 按文件夹组织素材
- 支持引用状态识别
- 支持在文章编辑器中快速选择
- 预览统一使用缩略图，避免后台卡顿

这样媒体才是资产，而不是垃圾堆。

### 3. 权限真正落地

很多后台的权限只是菜单可见性控制，这远远不够。

更稳妥的做法是把权限落在具体动作上，例如：

- 是否可以发布文章
- 是否可以删除评论
- 是否可以管理标签
- 是否可以修改系统设置

只有这样，角色编辑才有意义。

### 4. 运营动作可追踪

运营后台不是静态配置页，而是一个持续工作的系统。

应该能看到：

- 谁改了什么
- 哪篇文章什么时候发布
- 哪些评论待处理
- 哪些媒体被高频引用

这部分能力会直接决定后台是否适合多人长期使用。

## 结语

真正有价值的博客后台，不在于堆多少功能，而在于让内容从创建、整理、发布到维护形成连续工作流。

当后台开始服务“长期生产内容”而不是“偶尔写一篇文章”，很多设计标准都会完全不一样。`,
  },
  {
    title: '为什么媒体库一定要有缩略图，而不是直接展示原图',
    slug: 'why-media-library-needs-thumbnails',
    excerpt:
      '后台图片一多就卡，往往不是框架慢，而是把原图当预览图用了。缩略图策略决定了媒体页和编辑页的可用性上限。',
    coverImage:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '为什么媒体库一定要有缩略图，而不是直接展示原图',
    seoDescription:
      '从加载成本、滚动性能、解码耗时与编辑体验出发，解释后台媒体库为何必须优先使用缩略图。',
    readingTime: 7,
    views: 980,
    publishedAt: '2026-03-08T06:30:00.000Z',
    categorySlug: 'frontend-experience',
    tagSlugs: ['performance', 'vue3', 'arco-design'],
    content: `# 为什么媒体库一定要有缩略图，而不是直接展示原图

当一个后台页面出现“哪里都卡”的时候，最常见的误判是：

> 是不是组件库太重了？

但很多时候，真正的问题根本不在组件库，而是在图片策略。

## 原图直接展示，会同时拖垮三件事

### 1. 网络传输

即使浏览器最终把图片显示在一个很小的卡片里，下载下来的依然可能是几 MB 的大图。

### 2. 图片解码

解码大图是需要 CPU 和内存的。页面里几十张原图同时进入视口时，主线程会明显变慢。

### 3. 滚动与交互

图片布局、懒加载、hover 动画、弹窗预览都叠在一起后，任何多余的图片成本都会被放大。

## 缩略图不是“可选优化”，而是基础设施

后台媒体库、文章编辑页、封面选择弹窗，本质上都属于“浏览型视图”。

这类视图的核心目标不是还原原图细节，而是：

- 快速识别图片
- 快速筛选和选择
- 快速滚动浏览

所以预览图最适合使用：

- 固定宽高比
- 明确的 \`width\` / \`height\`
- 单独的 previewUrl 或 thumbUrl
- 经过裁剪与压缩的小尺寸资源

## 一套更合理的实现方式

建议本地媒体与第三方图库统一遵循同一策略：

1. 列表卡片统一使用缩略图
2. 点击后再打开原图预览
3. 卡片预留固定尺寸，避免布局抖动
4. 编辑器与媒体库共用同一种媒体卡片视觉

这样用户的认知也更稳定。

## 结语

图片加载策略是后台体验里最容易被忽视、但影响最大的环节之一。

如果一个媒体库已经开始变卡，优先排查是否还在把原图当缩略图使用，通常比继续微调动画和布局更有效。`,
  },
  {
    title: '内容后台里的权限系统，不该只控制菜单显示',
    slug: 'permissions-should-control-actions',
    excerpt:
      '真正有用的权限系统，要从“页面能不能看见”继续下沉到“动作能不能执行”，否则角色配置形同虚设。',
    coverImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '内容后台里的权限系统，不该只控制菜单显示',
    seoDescription:
      '解释为什么菜单级权限远远不够，以及如何把角色权限真正落到新增、编辑、删除、发布等动作层。',
    readingTime: 6,
    views: 860,
    publishedAt: '2026-03-05T11:20:00.000Z',
    categorySlug: 'engineering',
    tagSlugs: ['nestjs', 'typescript', 'team-collaboration'],
    content: `# 内容后台里的权限系统，不该只控制菜单显示

菜单权限只解决了一个问题：用户能不能进入某个页面。

但后台的风险通常不发生在“进入页面”这一刻，而发生在具体动作上。

例如：

- 可以查看评论，但不能删除评论
- 可以编辑文章，但不能发布文章
- 可以查看标签，但不能管理标签

如果权限没有下沉到动作级别，角色系统就只是一个装饰层。

## 为什么动作级权限更重要

因为团队协作中的职责边界，本来就是按动作划分的。

内容编辑、运营、审核、管理员，他们看到的页面可能相同，但可执行动作完全不同。

## 设计动作级权限时的三个原则

### 粒度适中

权限不能粗到失去意义，也不能细到无法维护。

一个实用的颗粒度通常是：

- view
- create
- update
- delete
- publish
- manage

### 前后端同时校验

前端负责隐藏或禁用按钮，减少误操作。

后端负责最终拦截，保证安全边界。

### 角色编辑要能正确回显

很多系统的问题不在保存，而在回显。

如果用户刚去掉权限，重新打开角色编辑时又显示还在，系统可信度会立刻下降。

## 结语

权限系统一旦开始服务多人协作，它就不再是“功能菜单”。它本质上是在描述团队分工。

所以最重要的问题不是“这个页面谁能看”，而是“这个动作谁能做”。`,
  },
  {
    title: '前端管理后台，为什么统一工具栏样式很重要',
    slug: 'consistent-admin-toolbar-matters',
    excerpt:
      '搜索框、筛选项、操作按钮如果在每个页面都换一种排法，后台会显得非常杂乱。统一工具栏是体验稳定性的基础。',
    coverImage:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '前端管理后台，为什么统一工具栏样式很重要',
    seoDescription:
      '从认知负担、操作效率和视觉秩序三个层面，解释后台各列表页为什么需要统一的工具栏布局。',
    readingTime: 5,
    views: 720,
    publishedAt: '2026-03-03T03:10:00.000Z',
    categorySlug: 'product-design',
    tagSlugs: ['design-system', 'arco-design', 'content-strategy'],
    content: `# 前端管理后台，为什么统一工具栏样式很重要

后台页面最常见的问题之一，不是功能缺失，而是每个列表页都像不同的人临时拼出来的。

尤其是顶部工具栏：

- 有的搜索框独占一整行
- 有的下拉选择特别长
- 有的操作按钮跑到右上角
- 有的页面还会自动换行

这些问题叠加起来，会让用户感觉系统“不稳定”。

## 统一工具栏的价值

### 降低认知成本

当用户在文章、标签、评论、用户、媒体之间切换时，如果工具栏结构一致，他几乎不需要重新学习页面。

### 提高操作速度

搜索、筛选、创建，这三类动作通常是列表页最常用的操作。

把它们稳定地从左到右排开，用户会更快形成肌肉记忆。

### 建立后台秩序感

统一的控件宽度和间距，会让页面更像同一套产品，而不是多个孤立页面。

## 一种更合适的布局原则

推荐把列表页顶部统一成这样：

1. 搜索框放最左
2. 常用筛选项紧跟其后
3. 重置和新增按钮放在筛选项后面
4. 控件宽度按文案和实际内容设定，而不是一刀切

## 结语

统一不是呆板，而是让用户不必每到一个页面都重新适应。

一个稳定的后台，往往先体现在这些“看起来很小”的界面秩序上。`,
  },
  {
    title: '给博客增加 AI 工作流时，先解决哪三件事',
    slug: 'three-things-before-ai-workflow',
    excerpt:
      'AI 能帮内容团队提效，但前提不是先接模型，而是先把结构化输入、审核流程和结果可追踪性准备好。',
    coverImage:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '给博客增加 AI 工作流时，先解决哪三件事',
    seoDescription:
      '从产品设计角度说明，接入 AI 前必须先准备的输入结构、人工审核与日志追踪三大能力。',
    readingTime: 7,
    views: 650,
    publishedAt: '2026-02-27T08:40:00.000Z',
    categorySlug: 'ai-productivity',
    tagSlugs: ['ai-workflow', 'content-strategy', 'team-collaboration'],
    content: `# 给博客增加 AI 工作流时，先解决哪三件事

很多团队一提到 AI，就先问接哪个模型、写哪个提示词。

但对内容后台来说，更先决的问题其实是系统准备度。

## 第一件事：输入必须结构化

如果分类、标签、摘要、SEO 信息、发布状态都还是混乱的，AI 很难给出稳定结果。

结构化字段越清晰，AI 越容易参与实际工作流。

## 第二件事：结果必须可审核

AI 适合做初稿、建议和辅助整理，不适合直接无审查地进入发布链路。

后台至少要提供：

- 草稿保存
- 修订说明
- 手动确认
- 回滚记录

## 第三件事：行为必须可追踪

一旦 AI 开始参与生产，就必须能回答这些问题：

- 哪条内容是 AI 生成或辅助的
- 谁确认了最终版本
- 修改过哪些字段
- 何时进入发布流程

否则问题出现时很难回溯。

## 结语

AI 工作流最先升级的不是“生成能力”，而是后台的信息结构和流程约束。

只有这些基础先搭好，AI 才会带来效率，而不是额外混乱。`,
  },
  {
    title: '用 Prisma 和 PostgreSQL 维护内容模型时，需要注意什么',
    slug: 'prisma-postgresql-content-modeling',
    excerpt:
      '内容系统的数据模型会随着后台功能不断演进。提前为状态、关联、修订和可扩展性留出空间，会少走很多弯路。',
    coverImage:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '用 Prisma 和 PostgreSQL 维护内容模型时，需要注意什么',
    seoDescription:
      '围绕文章、标签、评论、媒体、修订与配置版本，梳理内容后台在 Prisma 与 PostgreSQL 下的数据建模注意事项。',
    readingTime: 9,
    views: 540,
    publishedAt: '2026-02-20T07:45:00.000Z',
    categorySlug: 'engineering',
    tagSlugs: ['postgresql', 'prisma', 'nestjs', 'typescript'],
    content: `# 用 Prisma 和 PostgreSQL 维护内容模型时，需要注意什么

博客系统在早期看起来很简单，但一旦后台能力扩展，数据模型会迅速复杂起来。

最典型的扩展路径包括：

- 文章从单一状态变成草稿、已发布、定时发布、定时下线
- 评论从简单列表变成会话、审核、点赞、回复
- 媒体从单个链接变成文件夹、标签、引用关系
- 配置从单值更新变成带版本的变更记录

## 模型设计时建议预留的能力

### 可扩展状态字段

不要一开始就把状态写死成布尔值。

枚举会更适合长期维护。

### 关联关系保持明确

文章和标签适合显式中间表，而不是直接数组。

这样后续统计、筛选、排序都更灵活。

### 审计信息不要缺席

像 \`createdAt\`、\`updatedAt\`、\`createdById\`、\`targetLabel\` 这种字段，在后台系统里非常重要。

很多运营问题最后都需要靠这些信息还原现场。

### 为演进留空间

像定时发布、修订记录、回收站、操作日志，最好从模型层就能容纳，而不是等上线后再硬加。

## 结语

内容后台的数据模型，本质上是在为未来的后台功能做预算。

今天建模时少省一点事，未来就能少做很多破坏性迁移。`,
  },
];

postsSeed.push(...extraPostsSeed);

const defaultSettings = {
  siteName: 'Aurora Journal',
  siteSubtitle: '',
  siteDescription: '一个具备前后台完整管理能力的博客系统。',
  logo: 'https://api.dicebear.com/9.x/shapes/svg?seed=Aurora+Journal',
  heroTitle: 'Aurora Journal',
  heroDescription: '分享文章、项目与想法。',
  footerText: 'Aurora Journal',
  githubUrl: 'https://github.com/',
  icp: '',
  aboutTitle: '关于 Aurora Journal',
  aboutContent: '一个用于内容发布与后台管理的现代博客项目。',
};

async function syncPermissionsAndRoles() {
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description,
        group: permission.group,
      },
      create: permission,
    });
  }

  for (const template of SYSTEM_ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        description: template.description,
        isSystem: true,
      },
      create: {
        code: template.code,
        name: template.name,
        description: template.description,
        isSystem: true,
      },
    });

    const permissions = await prisma.permission.findMany({
      where: { code: { in: template.permissions } },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

  return prisma.role.findUniqueOrThrow({
    where: { code: 'super-admin' },
  });
}

async function seedAdminUser() {
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const superAdminRole = await syncPermissionsAndRoles();

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aurora.local' },
    update: {
      name: 'Aurora Admin',
      avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=Aurora',
      passwordHash,
      passwordUpdatedAt: new Date(),
    },
    create: {
      email: 'admin@aurora.local',
      name: 'Aurora Admin',
      passwordHash,
      avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=Aurora',
      passwordUpdatedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: superAdminRole.id,
    },
  });

  return admin;
}

async function seedCategories() {
  const categories = new Map<string, { id: string }>();

  for (const item of categoriesSeed) {
    const category = await prisma.category.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        visible: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        visible: true,
      },
      select: { id: true, slug: true },
    });

    categories.set(item.slug, { id: category.id });
  }

  return categories;
}

async function seedTags() {
  const tags = new Map<string, { id: string }>();

  for (const item of tagsSeed) {
    const tag = await prisma.tag.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        color: item.color,
        visible: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        color: item.color,
        visible: true,
      },
      select: { id: true, slug: true },
    });

    tags.set(item.slug, { id: tag.id });
  }

  return tags;
}

async function seedPosts(categories: Map<string, { id: string }>, tags: Map<string, { id: string }>) {
  for (const item of postsSeed) {
    const category = categories.get(item.categorySlug);
    if (!category) {
      throw new Error(`Category not found for slug: ${item.categorySlug}`);
    }

    const post = await prisma.post.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        coverImage: item.coverImage,
        status: PostStatus.PUBLISHED,
        featured: item.featured ?? false,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        readingTime: item.readingTime,
        views: item.views,
        publishedAt: new Date(item.publishedAt),
        categoryId: category.id,
      },
      create: {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.content,
        coverImage: item.coverImage,
        status: PostStatus.PUBLISHED,
        featured: item.featured ?? false,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        readingTime: item.readingTime,
        views: item.views,
        publishedAt: new Date(item.publishedAt),
        categoryId: category.id,
      },
      select: { id: true },
    });

    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    await prisma.postTag.createMany({
      data: item.tagSlugs
        .map((slug) => tags.get(slug)?.id)
        .filter((tagId): tagId is string => Boolean(tagId))
        .map((tagId) => ({
          postId: post.id,
          tagId,
        })),
      skipDuplicates: true,
    });
  }
}

async function seedComments() {
  const targetPosts = await prisma.post.findMany({
    where: {
      slug: {
        in: [
          'build-operable-content-platform',
          'why-media-library-needs-thumbnails',
          'permissions-should-control-actions',
          ...extraCommentsSeed.map((item) => item.postSlug),
        ],
      },
    },
    select: { id: true, slug: true },
  });

  const postMap = new Map(targetPosts.map((item) => [item.slug, item.id]));

  const comments = [
    {
      author: '林曜',
      email: 'linyao@example.com',
      content: '这篇把后台的重点拆得很清楚，特别适合准备重构内容系统的人。',
      approved: true,
      postId: postMap.get('build-operable-content-platform'),
    },
    {
      author: '周宁',
      email: 'zhouning@example.com',
      content: '媒体缩略图这部分太真实了，后台卡顿很多时候真不是框架的问题。',
      approved: true,
      postId: postMap.get('why-media-library-needs-thumbnails'),
    },
    {
      author: 'Echo',
      email: 'echo@example.com',
      content: '动作级权限这个点很关键，不然角色配置保存了也没有实际意义。',
      approved: false,
      postId: postMap.get('permissions-should-control-actions'),
    },
    ...extraCommentsSeed.map((item) => ({
      author: item.author,
      email: item.email,
      content: item.content,
      approved: item.approved,
      postId: postMap.get(item.postSlug),
    })),
  ].filter((item): item is { author: string; email: string; content: string; approved: boolean; postId: string } => Boolean(item.postId));

  for (const item of comments) {
    const exists = await prisma.comment.findFirst({
      where: {
        postId: item.postId,
        email: item.email,
        content: item.content,
      },
      select: { id: true },
    });

    if (!exists) {
      await prisma.comment.create({ data: item });
    }
  }
}

async function seedSettings() {
  await prisma.setting.upsert({
    where: { key: 'site' },
    update: { value: JSON.stringify(defaultSettings) },
    create: { key: 'site', value: JSON.stringify(defaultSettings) },
  });
}

async function main() {
  await seedAdminUser();
  const categories = await seedCategories();
  const tags = await seedTags();
  await seedPosts(categories, tags);
  await seedComments();
  await seedSettings();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
