# Kana Jump — 日语学习

一款专注于假名学习的 PWA 应用，支持离线使用、答题历史同步和错题针对性练习。

---

## 功能

### 练习模式

- 顺序或随机两种出牌方式
- 按分组（清音 / 浊音 / 半浊音 / 拗音）和行（か行、さ行…）精细筛选
- 答题时支持前进、后退、跳过
- 结束后可一键重练错题或跳过的卡片

### 浏览模式

- 按行分组展示所有假名
- 支持罗马音 / 平假名 / 片假名搜索
- 点击任意卡片查看详情（平假名、片假名、罗马音、配套单词）

### 统计模式

- 错题看板：按"还需练习"和"趋于掌握"分类，颜色深浅反映错误次数
- 支持按行筛选错题，一键练习某行错题
- 历史记录列表：显示每次练习的时间、正确率、筛选条件，可批量删除

### PWA / 离线支持

- App Shell 预缓存，弱网或无网络时界面秒开
- Supabase API 超时 4s 自动降级到本地缓存，离线仍可查看历史数据
- 支持"添加到主屏幕"，iOS / Android 均可作为独立 App 使用

---

## 技术栈

| 层级        | 技术                          |
| ----------- | ----------------------------- |
| 框架        | React 18 + TypeScript         |
| 构建        | Vite 6                        |
| 样式        | Tailwind CSS                  |
| 后端 / 认证 | Supabase（PostgreSQL + Auth） |
| PWA         | vite-plugin-pwa + Workbox     |
| 部署        | Vercel                        |

---

## 数据结构

卡片数据位于 `public/kana_cards.json`，共 102 张，覆盖四个分组：

| 分组                 | 数量 |
| -------------------- | ---- |
| 清音（seion）        | 46   |
| 浊音（dakuten）      | 18   |
| 半浊音（handakuten） | 5    |
| 拗音（youon）        | 33   |

每张卡片包含：`id` / `roma`（罗马音）/ `hira`（平假名）/ `kata`（片假名）/ `word_ja`（配套日语单词）/ `word_zh`（中文释义）/ `group` / `row`

---

## 本地开发

**环境要求：** Node.js 18+

```bash
# 安装依赖
npm install

# 启动开发服务器（局域网可访问，用于 iOS 真机调试）
npm run dev -- --host

# 构建生产版本
npm run build

# 本地预览构建产物（含 Service Worker）
npm run preview
```

**环境变量：** 在项目根目录创建 `.env.local`：

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Supabase 数据库

需要以下两张表：

```sql
-- 练习会话
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  total int,
  correct int,
  wrong int,
  skipped int,
  filter_groups text[],
  filter_rows text[]
);

-- 每张卡片的作答记录
create table card_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  session_id uuid references sessions not null,
  card_id text not null,
  result text check (result in ('correct', 'wrong', 'skipped'))
);

-- RLS：用户只能读写自己的数据
alter table sessions enable row level security;
alter table card_attempts enable row level security;

create policy "own sessions" on sessions for all using (auth.uid() = user_id);
create policy "own attempts" on card_attempts for all using (auth.uid() = user_id);
```

---

## 项目结构

```
src/
├── components/
│   ├── AuthGate.tsx        # 登录 / 注册界面
│   ├── FilterBar.tsx       # 分组 & 行筛选器
│   ├── CardStack.tsx       # 答题卡片主界面
│   ├── Card.tsx            # 单张卡片（含翻转动画）
│   ├── ResultPanel.tsx     # 答题结束结算页
│   ├── BrowsePanel.tsx     # 浏览 & 搜索面板
│   ├── ErrorDashboard.tsx  # 错题统计看板
│   ├── HistoryPanel.tsx    # 历史记录列表
│   ├── KanaDetailModal.tsx # 假名详情弹窗
│   └── SessionStats.tsx    # 练习中实时计数
├── hooks/
│   ├── useAuth.ts          # Supabase 认证状态
│   ├── useCards.ts         # 卡片加载 & 筛选 & 排序
│   ├── useSession.ts       # 答题会话状态机
│   └── useHistory.ts       # 历史记录 & 错题统计
├── services/
│   ├── storage.ts          # IStorageService 接口定义
│   └── supabaseStorage.ts  # Supabase 实现
├── types/kana.ts           # KanaCard / KanaData 类型
├── utils/kanaOrder.ts      # 假名排序规则
└── lib/supabase.ts         # Supabase 客户端初始化
```

---

## iOS 调试

1. iPhone 连接 Mac，打开 **设置 → Safari → 高级 → Web 检查器**
2. Mac Safari → **开发** 菜单 → 选择设备
3. 在 iPhone Safari 打开本地 dev server 地址（`npm run dev -- --host` 会显示局域网 IP）

PWA 效果（图标、全屏模式）需要在 Safari 用"添加到主屏幕"后才能看到，dev server 下 Service Worker 已启用（`devOptions.enabled: true`）。
