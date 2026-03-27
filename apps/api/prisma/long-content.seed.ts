export const extraCategoriesSeed = [
  {
    name: '后端架构',
    slug: 'backend-architecture',
    description: '围绕接口边界、任务调度、权限模型与服务拆分的后端实践。',
  },
  {
    name: '数据模型',
    slug: 'data-modeling',
    description: '聚焦内容系统里的建模、快照、恢复、检索与演进策略。',
  },
];

export const extraTagsSeed = [
  { name: 'Markdown 编辑器', slug: 'markdown-editor', color: '#2563eb' },
  { name: '媒体流水线', slug: 'media-pipeline', color: '#0f766e' },
  { name: 'RBAC', slug: 'rbac', color: '#ef4444' },
  { name: '可观测性', slug: 'observability', color: '#7c3aed' },
  { name: '发布管理', slug: 'release-management', color: '#f97316' },
  { name: '流程自动化', slug: 'workflow-automation', color: '#22c55e' },
  { name: '数据建模', slug: 'data-modeling', color: '#0ea5a4' },
  { name: '内容指标', slug: 'content-analytics', color: '#ec4899' },
];

export const extraPostsSeed = [
  {
    title: '把文章编辑器做成真正可写的工作台',
    slug: 'build-a-real-editor-workbench',
    excerpt:
      '一套顺手的文章编辑器，不只是有输入框和发布按钮，而是要把媒体选择、草稿节奏、修订说明和右侧辅助操作真正串成连续工作流。',
    coverImage:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '把文章编辑器做成真正可写的工作台',
    seoDescription:
      '围绕媒体抽屉、修订记录、封面选择、SEO 与发布动作，拆解内容后台里一套真正好用的文章编辑器应该如何设计。',
    readingTime: 14,
    views: 1480,
    featured: true,
    publishedAt: '2026-03-22T09:20:00.000Z',
    categorySlug: 'frontend-experience',
    tagSlugs: ['markdown-editor', 'vue3', 'arco-design', 'content-strategy'],
    content: `# 把文章编辑器做成真正可写的工作台

很多后台的文章编辑页，表面上功能很全，实际写起来却很累。页面上到处都是字段，但真正高频的动作没有被串起来，结果就是写作者不断在“输入内容”“找图片”“调整封面”“补 SEO”“回看修订”之间来回切换。

![编辑器工作台](https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80)

如果把编辑器当成内容团队每天都会打开数十次的工作台，而不是一张普通表单，设计重点就会完全不同。

## 先识别真正高频的动作

一篇文章从草稿到发布，最常见的路径其实很稳定：

1. 输入标题、摘要和正文
2. 选择封面和插图
3. 调整分类、标签与发布时间
4. 填写修订说明
5. 决定是保存草稿还是直接发布

真正影响效率的，不是字段够不够多，而是这些动作能不能一气呵成。比如媒体选择器如果直接把整页内容往下撑长，写作者每次加图都要丢掉上下文；右侧面板如果装了太多东西，却又显示不全，就会让高频操作变成查找游戏。

## 媒体选择应该从“嵌入列表”改成“抽屉工作流”

媒体选择最容易犯的错，是在正文编辑区里直接展开一个巨长列表。这样看似省了一次点击，实际上会带来三个问题：

- 编辑区的视觉重心被打断
- 页面高度不断增长，滚动成本越来越高
- 插图、封面、SEO 配图的选择行为无法复用同一套交互

更合适的方式是把媒体选择统一放进抽屉或全屏弹层，让它保持独立上下文：

~~~vue
<a-drawer
  v-model:visible="coverPickerVisible"
  width="min(1180px, 96vw)"
  unmount-on-close
>
  <template #title>选择封面</template>

  <MediaPickerGrid
    :keyword="keyword"
    :folder-id="folderId"
    :source="source"
    @select="handlePickCover"
  />
</a-drawer>
~~~

这里的关键不是“抽屉”本身，而是把媒体浏览做成一个完整而稳定的局部界面：有统一卡片尺寸、有搜索和筛选、有清晰的选中反馈，也能同时容纳本地媒体和第三方图库。

## 右侧面板不应该只是堆字段

编辑器右侧通常承载的是“辅助决策”，而不是“主输入”。因此它更适合放这些内容：

- 发布状态、定时发布、定时下线
- 分类、标签、精选状态
- 封面与 SEO
- 修订记录和修订说明

这些块的共性是：信息密度高，但不需要一直占据正文宽度。如果右侧空间不够，可以果断改成二级抽屉或分段卡片，而不是把所有内容硬塞在一个窄栏里。

~~~ts
type EditorAssistPanel = {
  publish: {
    status: 'DRAFT' | 'PUBLISHED';
    scheduledPublishAt: string | null;
    scheduledUnpublishAt: string | null;
  };
  taxonomy: {
    categoryId: string | null;
    tagIds: string[];
    featured: boolean;
  };
  seo: {
    coverImage: string;
    seoTitle: string;
    seoDescription: string;
  };
  revision: {
    reason: string;
    historyCount: number;
  };
};
~~~

只要结构清晰，右侧面板就不会显得挤。真正糟糕的是既没有优先级，也没有稳定布局，导致封面、按钮、输入框和预览彼此抢位置。

## 修订说明要跟“改了什么”形成闭环

修订说明最容易被忽略，因为很多人写到最后只想点保存。更顺手的做法不是强迫填写，而是在用户未填写时，根据变更字段自动生成一条可读文案，比如：

- 更新标题与摘要
- 调整封面并补充 SEO 描述
- 修改分类、标签与发布时间

这样修订说明才不会沦为空表单，而是真正变成版本理解成本最低的一层记录。

## 一套编辑器，应该让写作者保持专注

编辑器做得好不好，看的是写作者是否能持续停留在内容上下文里。凡是让人频繁跳出思路的设计，最后都会变成“功能在，但不想用”。

所以真正好的文章编辑器，不是把所有功能都塞进一页，而是让写作、选图、编排、发布这些动作能自然衔接。只要这条路径顺了，后台才配得上叫工作台。
`,
  },
  {
    title: '定时发布与定时下线，如何让内容节奏真正可控',
    slug: 'scheduled-publishing-and-offline-control',
    excerpt:
      '内容团队真正需要的不是一个“立即发布”按钮，而是一套可以提前排期、自动上线、自动下线、还能回溯变更原因的发布节奏控制系统。',
    coverImage:
      'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '定时发布与定时下线，如何让内容节奏真正可控',
    seoDescription:
      '从数据字段、后台交互、前台可见性与异常处理四个层面，讲清楚定时发布和定时下线在内容系统里的完整设计。',
    readingTime: 13,
    views: 1230,
    publishedAt: '2026-03-21T08:10:00.000Z',
    categorySlug: 'content-ops',
    tagSlugs: ['release-management', 'nestjs', 'postgresql', 'workflow-automation'],
    content: `# 定时发布与定时下线，如何让内容节奏真正可控

很多博客系统只有“草稿”和“发布”两个状态，看起来简单，但只要开始做专题页、活动页、节日内容或者批量排期，就会发现这种模型很快不够用。

内容运营真正想要的是：

- 先把内容写完，指定某个时间自动上线
- 某些内容只在一段窗口期内展示，到点后自动下线
- 不需要人工守在后台点按钮
- 出问题时能追溯是谁改了时间、为什么改

![发布时间控制](https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80)

## 数据模型先别偷懒

如果状态字段只留一个 published: boolean，后面所有排期能力都会变得别扭。更稳妥的做法是把“状态”和“时间窗口”拆开：

~~~ts
type PublishState = {
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: Date | null;
  scheduledPublishAt: Date | null;
  scheduledUnpublishAt: Date | null;
};
~~~

这样做的好处是：

- 当前状态可以直接用于后台列表筛选
- 计划发布时间和计划下线时间可以独立判断
- 前台查询时不必依赖额外任务把状态回写
- 历史记录更容易解释

## 前台查询必须按“当前时间窗口”过滤

真正可靠的定时发布，不是等定时任务把状态改掉，而是让前台读取时就天然知道什么应该展示：

~~~ts
const now = new Date();

const publishedWhere = {
  status: 'PUBLISHED',
  AND: [
    {
      OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
    },
    {
      OR: [{ scheduledUnpublishAt: null }, { scheduledUnpublishAt: { gt: now } }],
    },
  ],
};
~~~

这种写法的优点是简单、直接，而且即使服务重启、定时任务失败，前台的可见性仍然是正确的。

## 后台控件不要用半成品时间输入

发布时间是敏感动作，控件体验必须稳定。选择器最好具备这些特征：

- 明确的日期时间输入
- 能一键清空
- 能清楚区分“定时发布”和“定时下线”
- 保存前给出规则校验

最容易漏掉的校验是：

1. 定时下线不能早于定时发布
2. 已发布文章设置未来发布时间时，要明确这代表什么
3. 已过期的下线时间要有可理解的提醒

## 运营视角比技术视角更重要

后台里真正需要展示的不是“某字段已写入数据库”，而是更贴近运营语言的信息：

- 将于 3 月 28 日 09:00 自动发布
- 将于 4 月 5 日 00:00 自动下线
- 当前对外可见
- 当前仅后台可见

这些描述比原始时间戳更能帮助团队快速判断状态。

## 还要把修订与日志串起来

发布时间是高价值字段，任何改动都应该进入修订说明和操作日志。否则团队之后会遇到两个非常常见的问题：

- 明明昨天还在线，今天为什么没了
- 谁把文章从今晚改成了明天发布

如果操作日志只记一行技术字段，排查仍然很累。更好的方式是记录书面化动作，例如“调整发布窗口”，并在详情里展示旧值和新值。

~~~json
{
  "action": "调整发布窗口",
  "before": {
    "scheduledPublishAt": "2026-03-24T01:00:00.000Z",
    "scheduledUnpublishAt": null
  },
  "after": {
    "scheduledPublishAt": "2026-03-25T01:00:00.000Z",
    "scheduledUnpublishAt": "2026-04-02T01:00:00.000Z"
  }
}
~~~

## 节奏可控，内容系统才算成熟

定时发布与定时下线看起来只是两个字段，实际上决定了内容系统是否具备节奏管理能力。只有当“写好”“排期”“上线”“下线”“回溯”都形成闭环，后台才真正从写作工具升级为运营系统。
`,
  },
  {
    title: '评论审核不只是通过与驳回：会话、规则与人工复核的完整设计',
    slug: 'comment-moderation-conversation-design',
    excerpt:
      '评论系统最容易被低估。真正好用的评论审核，不是堆几个按钮，而是让会话关系、审核规则、人工复核和反馈提示能协同工作。',
    coverImage:
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '评论审核不只是通过与驳回：会话、规则与人工复核的完整设计',
    seoDescription:
      '拆解评论审核规则、会话视图、批量处理和前台提示设计，让评论系统既能控风险，也不会把管理体验做僵。',
    readingTime: 15,
    views: 1110,
    publishedAt: '2026-03-19T11:00:00.000Z',
    categorySlug: 'content-ops',
    tagSlugs: ['workflow-automation', 'nestjs', 'typescript', 'team-collaboration'],
    content: `# 评论审核不只是通过与驳回：会话、规则与人工复核的完整设计

只要评论量稍微上来一点，后台很快就会暴露出问题。最常见的现象是：控制台里报错，前台没有提示；评论树层级混乱，运营找不到关键上下文；批量审核时又经常漏掉关联回复。

这类问题不是靠多一个按钮就能解决的，而是要从“会话结构”“规则校验”“人工复核”“反馈提示”四个层面一起设计。

![评论审核面板](https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80)

## 规则校验首先要对用户可见

如果系统要求评论至少三个字，就不应该只在服务端报错，更不能只在控制台出现异常。用户真正需要的是即时、明确、可操作的提示。

比如：

- 评论内容至少需要 3 个字
- 命中了屏蔽词，请修改后再提交
- 该邮箱域名需要人工审核

~~~ts
function validateCommentPayload(payload: { content: string }) {
  if (payload.content.trim().length < 3) {
    throw new BadRequestException('评论内容至少需要 3 个字');
  }
}
~~~

这一步很基础，但影响非常大。没有明确提示，用户会把失败理解成系统坏了。

## 审核视图应该以“会话”为单位

后台直接平铺所有评论，看起来简单，实际上不适合运营。因为一个关键问题总是会出现：

> 这条回复到底是在回应谁？

所以审核页最好同时提供会话视图，把主评论和回复链放在一起。这样运营能快速判断语境，不会把孤立的一句话误判成攻击或广告。

更好的结构是：

- 主评论作为根节点
- 回复按时间顺序挂在下面
- 标出是否存在待审核内容
- 支持整段会话快速进入详情

## 批量操作要遵守层级关系

批量删除最容易出问题。假设你同时选中了主评论和它下面的一条回复，如果逻辑不处理，系统就可能重复删除，或者在某些数据库约束下报错。

更稳妥的做法是先解析父子关系，只对最上层需要执行动作的记录发请求：

~~~ts
function resolveBatchRemoveKeys(keys: string[], parentMap: Map<string, string | null>) {
  const selected = new Set(keys);

  return keys.filter((id) => {
    let current = parentMap.get(id);
    while (current) {
      if (selected.has(current)) {
        return false;
      }
      current = parentMap.get(current) ?? null;
    }
    return true;
  });
}
~~~

这种细节用户平时看不到，但它决定了批量操作到底稳不稳。

## 审核规则不该是死配置

很多系统只有一个“是否自动通过”的总开关，但实际运营更需要的是组合规则，例如：

- 最小评论长度
- 屏蔽词列表
- 自动通过域名白名单
- 可疑评论进入人工审核

这类规则不需要太复杂，但一定要能被后台管理者理解。配置项的文案越接近业务语言，规则越容易维护。

## 反馈系统决定了运营信心

评论审核是高频动作，必须有清晰反馈：

- 单条通过时给出明确成功提示
- 批量操作告诉用户一共处理了几条
- 删除后界面不要乱跳
- 有权限但无可操作记录时，也要保持状态稳定

如果界面每次操作后都重新抖动、排序变化、选中状态丢失，运营会很快失去使用信心。

## 结语

评论系统不是博客的配角。它一头连着前台用户体验，一头连着后台日常运营。真正成熟的评论审核，不是只有“通过”和“驳回”两个动作，而是让规则、会话、批量处理和错误提示形成完整闭环。
`,
  },
  {
    title: '内容回收站到底该存什么：文章、媒体、分类与标签的快照恢复策略',
    slug: 'recycle-bin-snapshot-recovery-strategy',
    excerpt:
      '回收站的难点从来不是“删掉之后放哪儿”，而是删除时要不要保留快照、恢复时要不要补回关联、不同实体类型各自应该保存什么信息。',
    coverImage:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '内容回收站到底该存什么：文章、媒体、分类与标签的快照恢复策略',
    seoDescription:
      '围绕文章、评论、媒体、分类与标签，拆解内容回收站里的快照字段、恢复逻辑、关联补回与冲突处理策略。',
    readingTime: 16,
    views: 980,
    featured: true,
    publishedAt: '2026-03-17T07:30:00.000Z',
    categorySlug: 'data-modeling',
    tagSlugs: ['data-modeling', 'prisma', 'postgresql', 'observability'],
    content: `# 内容回收站到底该存什么：文章、媒体、分类与标签的快照恢复策略

很多后台做回收站时，只做了一张“删除记录表”，里面放上标题、类型和删除时间。这样的回收站最多只能看，真正恢复时却经常发现原数据根本不够。

回收站真正的难点是两个问题：

1. 删除时，到底应该保存多少快照
2. 恢复时，到底要不要补回原来的关系

![回收站快照](https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80)

## 不同实体，快照策略必须不同

文章、评论、媒体、分类、标签看起来都属于“内容”，但恢复需求完全不一样。

### 文章

文章最适合保留：

- 基础字段
- 分类与标签关系
- 修订记录
- 关联评论

因为文章恢复后，用户通常期望它尽可能回到删除前状态，而不是只恢复一篇“空壳文章”。

### 媒体

媒体恢复不仅要恢复 URL 和文件名，还要恢复：

- 缩略图地址
- 文件夹归属
- 标记标签
- 来源类型

否则媒体库里虽然看起来“恢复成功”，实际分组和筛选已经丢了。

### 分类与标签

这两类实体最容易被忽略。很多系统删除后直接消失，但真实需求是：删掉分类或标签后，稍后还可能想恢复回来，并尽量补回原来的文章关联。

## 恢复不只是 create，还要考虑冲突

恢复功能最常见的误区，是把它理解成“一次普通创建”。但真实情况里会碰到很多冲突：

- 原 ID 是否已经被占用
- 原 slug 是否已被其他记录使用
- 原分类恢复时，文章是否已被重新分配分类
- 原标签恢复时，哪些文章还存在

所以恢复逻辑应该是显式的、可解释的，而不是简单把快照重新插回数据库。

~~~ts
async function assertSlugAvailable(
  entityType: 'post' | 'category' | 'tag',
  slug: string,
  entityId: string,
) {
  if (!slug) return;

  const exists = await findConflict(entityType, slug, entityId);
  if (exists) {
    throw new BadRequestException('别名已被占用，请先处理冲突后再恢复');
  }
}
~~~

## 快照字段应该服务恢复，不要只服务展示

真正好的快照，不只是让回收站列表里多显示一点信息，而是为了恢复动作本身服务。比如文章快照里多保留 tagIds 和分类信息，看起来像重复数据，但恢复时就能少查很多歧义。

~~~json
{
  "entityType": "post",
  "snapshot": {
    "post": {
      "title": "把文章编辑器做成真正可写的工作台",
      "categoryId": "cat_01"
    },
    "tagIds": ["tag_vue3", "tag_editor"],
    "revisions": [],
    "comments": []
  }
}
~~~

## 回收站页面也要有“预览价值”

如果回收站里只能看到一条标题，用户很难判断要不要恢复。更好的做法是给不同实体展示不同预览：

- 文章显示摘要、封面、分类和标签
- 媒体显示缩略图、来源和文件夹
- 评论显示作者、正文和所属文章
- 分类与标签显示可见状态、关联文章数量

这样用户恢复前就有足够判断依据。

## 操作日志与通知别忘了同步

删除、恢复、彻底删除这三个动作都应该留下记录。因为回收站本质上是风险动作的缓冲区，只要涉及内容安全，就必须让日志和通知链路同步。

运营真正想看到的不是一个技术动作键值，而是：

- 某篇文章已移入内容回收站
- 某个标签已从回收站恢复
- 某个媒体文件被彻底删除

## 结语

回收站不是数据库里的延迟删除角落，而是内容系统里的“安全带”。安全带真正有价值的前提，是删除时保留足够快照，恢复时恢复足够关系。只要这一点做对了，文章、媒体、分类和标签才都能被真正纳入可回滚的内容流程。
`,
  },
  {
    title: '媒体库想要真正顺手，文件夹、引用关系与缩略图流水线缺一不可',
    slug: 'media-library-folder-reference-thumbnail-pipeline',
    excerpt:
      '媒体库不是把图片堆在一起就够了。只要内容团队开始高频写作，文件夹组织、引用判断、缩略图生成和统一卡片尺寸就都会变成刚需。',
    coverImage:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '媒体库想要真正顺手，文件夹、引用关系与缩略图流水线缺一不可',
    seoDescription:
      '从文件夹组织、图片引用关系、缩略图生成到统一卡片展示，解释为什么媒体库要按照真正的资产管理思路来设计。',
    readingTime: 15,
    views: 1020,
    publishedAt: '2026-03-15T10:15:00.000Z',
    categorySlug: 'engineering',
    tagSlugs: ['media-pipeline', 'performance', 'prisma', 'workflow-automation'],
    content: `# 媒体库想要真正顺手，文件夹、引用关系与缩略图流水线缺一不可

很多博客后台在媒体库这块只做到“能上传图片”，但只要图片数量上来，问题会立刻暴露：搜索难、滚动卡、引用关系不清、封面选择体验很差。

要把媒体库做成真正好用的资产管理界面，至少要解决四件事：组织方式、引用追踪、缩略图策略和统一展示。

![媒体库管理](https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80)

## 文件夹不是装饰，而是高频入口

一旦媒体开始服务多个栏目、专题和活动，文件夹就不再是可有可无的概念。它至少解决三个现实问题：

- 素材能快速归档
- 编辑器选择封面时可以先缩小范围
- 本地媒体和第三方导入图片也能形成统一结构

如果文件夹只是一个筛选下拉框，用户仍然会感觉它不像真正的目录。更接近直觉的方式，是在媒体页顶部单独展示文件夹条目，并让全部文件数量保持稳定，不会随着切换目录而变化。

## 引用关系要能被看见，也要能参与删除逻辑

媒体删除是高风险动作。真正有用的不是弹一个“确认删除吗”，而是先告诉用户：

- 这张图被几篇文章引用
- 正在被哪些文章使用
- 当前是否允许删除

只有把引用关系做出来，系统才知道什么时候应该禁止删除，什么时候可以放心清理。

~~~ts
const referenceCount = posts.filter((post) => {
  return [post.coverImage, post.content].some((value) => value.includes(media.url));
}).length;

if (referenceCount > 0) {
  throw new BadRequestException('该媒体仍被文章引用，暂不允许删除');
}
~~~

## 缩略图生成必须形成流水线

后台卡顿最常见的根因之一，就是把原图直接当预览图。真正稳妥的方式是上传时就补生成缩略图，然后所有列表和选择器统一使用缩略图。

一个简单的生成策略可以是：

- 上传成功后生成固定宽度的 webp 缩略图
- 原图和缩略图同时保存
- 列表页永远优先使用缩略图
- 点击预览时再看原图

~~~ts
await sharp(uploadPath)
  .resize({ width: 640, withoutEnlargement: true })
  .webp({ quality: 78 })
  .toFile(thumbPath);
~~~

这一步做完后，媒体库、文章编辑器、封面选择弹窗都能共用同一套图片策略，整体体验会稳定很多。

## 卡片尺寸统一，选择才会顺手

如果媒体库一套卡片、文章编辑器另一套卡片、封面选择弹窗又是扁扁的一条，用户会很难形成稳定预期。更好的方式是：

- 本地媒体与第三方图库保持同样的网格比例
- 卡片内图片区始终固定高度
- 标题和信息区按相同结构排列
- hover、选中和禁用状态统一

这比单纯“页面能展示出图片”重要得多，因为它直接影响选图速度。

## 结语

媒体库真正的价值，不是让图片有地方放，而是让图片能被快速找到、稳定预览、安全删除、重复利用。文件夹、引用关系、缩略图流水线和统一卡片结构，缺任何一个，媒体库都会很快从工具变成负担。
`,
  },
  {
    title: '仪表盘不该只是数字墙：给内容团队看的指标编排方式',
    slug: 'content-dashboard-metrics-layout',
    excerpt:
      '一个内容后台的仪表盘，不应该只是把发布数、评论数、访问量堆在一屏里，而是要按照“先看风险，再看进度，再看内容入口”的顺序来组织信息。',
    coverImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '仪表盘不该只是数字墙：给内容团队看的指标编排方式',
    seoDescription:
      '围绕内容团队的日常决策，解释后台仪表盘该展示哪些信息、如何做卡片层级、怎样避免重复内容和无效装饰。',
    readingTime: 12,
    views: 870,
    publishedAt: '2026-03-13T06:40:00.000Z',
    categorySlug: 'product-design',
    tagSlugs: ['content-analytics', 'design-system', 'content-strategy', 'arco-design'],
    content: `# 仪表盘不该只是数字墙：给内容团队看的指标编排方式

很多后台一打开仪表盘，用户会看到一整排数字卡片：文章总数、评论总数、浏览量、草稿数。信息看似很多，真正要做事的时候却并不好用，因为这些数字没有被组织成决策顺序。

好的仪表盘不是“数字越多越专业”，而是要回答内容团队一进后台最关心的三个问题：

1. 今天有没有需要立刻处理的风险
2. 当前内容生产处在哪个节奏
3. 接下来应该点进哪个入口继续处理

![仪表盘卡片布局](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80)

## 先看风险，再看进度

仪表盘最上方应该优先显示有动作价值的信息，比如：

- 待审核评论数量
- 定时发布但尚未到点的文章数量
- 最近 24 小时的异常操作
- 回收站是否有待恢复内容

这类信息不是“了解一下”，而是提醒用户要不要立刻介入。它们应该比“累计发过多少篇文章”更靠前。

## 卡片设计要有层级，而不是平均铺开

如果所有卡片大小、背景、阴影都一样，用户会下意识觉得这些信息同等重要。实际并不是这样。

更稳妥的做法是：

- 核心风险卡片尺寸更大
- 概览数据保持整齐但不喧宾夺主
- 最近更新、最新评论这类入口卡片作为第二层
- 卡片之间通过阴影和留白形成稳定分组

~~~ts
const dashboardSections = [
  { key: 'alerts', priority: 'high' },
  { key: 'overview', priority: 'medium' },
  { key: 'recentPosts', priority: 'medium' },
  { key: 'recentComments', priority: 'medium' },
  { key: 'quickActions', priority: 'low' },
];
~~~

这比单纯把所有指标做成一排更接近真实使用方式。

## 仪表盘不是装饰页，动作入口要跟指标放在一起

最容易浪费空间的设计，是展示一堆数字，但不给下一步。更合理的方式是让每组信息都能直接带用户进入对应页面：

- 点待审核评论，进入评论管理
- 点草稿数，进入文章列表并筛出草稿
- 点最近恢复内容，进入回收站

一旦指标和入口分离，仪表盘就会变成只看不动的看板。

## 视觉效果要服务扫描效率

卡片需要明显，但不能刺眼。真正有帮助的增强通常是这些：

- 白到灰白的轻微背景过渡
- 更稳定的边框与悬浮阴影
- 首屏卡片错落入场，形成节奏
- 深色模式下保持整体对比，而不是一片灰蒙蒙

很多所谓“精美仪表盘”失败的原因，不是动画少，而是层级和对比没有建起来。

## 避免重复内容

一个常见问题是：总览里已经显示了最近文章，下面又来一块几乎一样的最近文章；待审核评论显示一次，最新评论里又重复一次。重复内容越多，仪表盘越像填空题。

更好的思路是给每块明确职责：

- 总览只负责回答“整体状况”
- 最近更新负责给入口
- 风险提醒负责促使操作
- 快捷操作负责节省跳转

## 结语

仪表盘真正的目标，不是把系统里所有数据都放进去，而是帮内容团队在十几秒内判断局面、进入工作。只要围绕“风险、进度、入口”来编排，再配合足够清晰的卡片层级，仪表盘就会从装饰页变成真正有用的工作首页。
`,
  },
  {
    title: '配置版本与安全回滚：站点设置为什么也需要版本管理',
    slug: 'settings-versioning-and-safe-rollback',
    excerpt:
      '站点设置看起来像几个表单字段，实际上每次改动都可能影响首页、关于页、导航和 SEO，因此配置版本管理和安全回滚并不是锦上添花。',
    coverImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
    seoTitle: '配置版本与安全回滚：站点设置为什么也需要版本管理',
    seoDescription:
      '从变更可追溯、版本恢复、预览差异和风险控制四个角度，解释内容后台为什么要给站点设置加入版本管理。',
    readingTime: 12,
    views: 790,
    publishedAt: '2026-03-11T05:50:00.000Z',
    categorySlug: 'backend-architecture',
    tagSlugs: ['release-management', 'observability', 'typescript', 'workflow-automation'],
    content: `# 配置版本与安全回滚：站点设置为什么也需要版本管理

很多内容系统对文章特别谨慎，有草稿、有修订、有回收站，但对站点设置却非常随意：谁都能改，改完立即生效，也没有旧版本记录。问题通常要等到首页突然变了、关于页内容被覆盖、按钮链接跳错以后才暴露。

配置版本管理的意义，恰恰在于让这些风险动作也被纳入可追踪、可恢复的范围。

![配置版本管理](https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80)

## 为什么设置比看起来更敏感

站点设置表面上只是几个输入框，但它往往直接控制这些地方：

- 站点名称、副标题、页脚信息
- Hero 区文案和按钮链接
- 关于页标题与正文
- 首页分栏开关和排序
- 外链地址与备案信息

也就是说，一次设置改动实际上可能同时影响多个公开页面。既然影响范围这么大，就不应该只保留当前值。

## 最少也要有三个能力

### 1. 保存版本快照

每次更新设置时，都应该把变更前或变更后的完整值留下一份版本记录，并附上简短说明。

### 2. 可读的变更摘要

如果版本列表里只有一串 JSON，管理者很难快速判断该恢复哪一条。更好的方式是自动生成摘要，例如：

- 更新站点名称与页脚文案
- 调整首页分栏顺序
- 修改关于页内容

### 3. 一键恢复

恢复版本应该是显式动作，并且恢复后也要再生成一条新的版本记录，这样链路才完整。

~~~ts
await prisma.settingVersion.create({
  data: {
    settingKey: 'site',
    summary: '更新关于页内容',
    value: JSON.stringify(nextValue),
    createdById: user.id,
    createdByName: user.name,
  },
});
~~~

## 版本恢复不是单向撤销，而是一次新的变更

这点特别重要。很多人把“恢复版本”理解成把数据库改回去就结束，但在后台里，恢复本身也是一次需要被审计的动作。

因此恢复后最好同步做到：

- 记录是谁恢复的
- 记录恢复到了哪个版本
- 生成一条新的版本记录
- 在通知或日志里体现这次恢复动作

## 列表展示要让人快速判断差异

配置版本页面如果只是表格列出时间和摘要，仍然不够。用户还需要快速看到：

- 这次主要改了哪个模块
- 值的大致预览是什么
- 是否值得展开查看完整 JSON

所以版本详情可以保留原始 JSON，但列表层一定要先给出书面化动作和部分预览。

## 结语

配置版本管理的价值，不在于多一张页面，而在于让站点设置从“临时改一下”变成“受控变更”。只要设置开始影响公开页面和团队协作，它就应该拥有和文章、媒体同等级别的回滚能力。
`,
  },
];

export const extraCommentsSeed = [
  {
    postSlug: 'build-a-real-editor-workbench',
    author: '姜序',
    email: 'jiangxu@example.com',
    content: '把媒体选择独立成抽屉这个点很关键，不然编辑器的上下文总是被打断。',
    approved: true,
  },
  {
    postSlug: 'scheduled-publishing-and-offline-control',
    author: '闻鹤',
    email: 'wenhe@example.com',
    content: '前台按时间窗口过滤这块很稳，比等定时任务改状态可靠多了。',
    approved: true,
  },
  {
    postSlug: 'comment-moderation-conversation-design',
    author: '若川',
    email: 'ruochuan@example.com',
    content: '评论至少三个字这种规则就该直接给前台明确提示，纯控制台报错完全不行。',
    approved: true,
  },
  {
    postSlug: 'recycle-bin-snapshot-recovery-strategy',
    author: '阿澈',
    email: 'ache@example.com',
    content: '分类和标签也进回收站这点很实用，不然一旦误删就只能手工重建。',
    approved: true,
  },
  {
    postSlug: 'media-library-folder-reference-thumbnail-pipeline',
    author: '祁川',
    email: 'qichuan@example.com',
    content: '统一缩略图和统一卡片比例之后，媒体库和封面选择器的体验确实会差很多。',
    approved: false,
  },
];
