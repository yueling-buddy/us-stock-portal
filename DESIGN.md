# 聚合页设计规格（DESIGN）

> 适用范围：美股研究终端聚合页（`portal/`）。本文档是该子项目的设计"会话"载体，记录架构决策、数据模型、扩展方式与已知约束，使其可独立于主选股器（`rps/`）维护。

---

## 1. 定位与目标

聚合页是**纯导航层**，不做任何子工具的计算/渲染，只负责把分散部署在各沙箱的工具与定期栏目，**用一个固定 URL 串起来**。

设计原则（用户拍板）：
- **A. 链接跳转**：子工具各自独立沙箱，聚合页只做卡片 + 新标签打开链接；不内嵌 iframe（避免 X-Frame-Options / CORS / 滚动高度问题）。
- **B. 独立沙箱总入口**：聚合页自己部署成一个 sandbox，拿一个固定 URL 当总入口；子工具继续用各自 URL，聚合页只导航。
- **C. 模拟盘预留**：模拟盘暂未公网，先占位（`url:''`，卡片置灰 + "即将上线"）。
- **工具 vs 内容 二分**：选股功能 = 你操作的工具；栏目 = 你阅读的定期内容。这条线是分类的唯一准绳（曾明确：动量选股虽带"选股"二字，本质是每周栏目内容，归栏目不归工具）。

---

## 2. 信息结构

### 选股功能（`group:'tools'`）
| 卡片 | 说明 | 链接状态 |
|---|---|---|
| 美股选股器 | RPS + 基本面 + 拥挤度综合筛选 | 公网 fd07ae3 |
| RPS 画廊 | 个股 RPS K 线画廊 | 公网 9e305f…sh3 |
| 美股拥挤度 | 个股/板块量价拥挤度仪表盘 | 公网 cc602ab…gz2.agentos-app.net |
| 模拟盘 | 回测 + 每日模拟交易 + DPWD 仓位 | 占位（待上线） |

### 栏目（`group:'columns'`）
- **周策略**（整体市场解读）→ 最新一期 `us_market_report_YYYY-MM-DD.html`
- **动量选股**（个股筛选）→ 最新一期 `momentum_column_YYYY-MM-DD.html`
- **历史栏目归档**：按日期倒序列出所有历史期，每行含 日期 + 类型徽章（紫=周策略 / 蓝=动量选股）+ 查看链接。

> 栏目两族文件来源：`D:\Workbuddy\us_weekly_pipeline\output\`
> - `us_market_report_*` = 周策略（整体市场解读）
> - `momentum_column_*` = 动量选股（个股筛选）

---

## 3. 架构

- **单文件静态站**：`index.html` 内联 CSS + JS，无构建步骤、无后端、无外部依赖。
- **数据驱动**：所有菜单写在两个 JS 数组中，布局自动生成。加工具/栏目只改数组，不动布局。
- **导航**：sticky 顶部两个按钮切换「选股功能 / 栏目」分组（纯 `hidden` class 显隐）。
- **打开方式**：卡片渲染为 `<a target="_blank">`，新标签打开；占位卡片渲染为 `<div class="disabled">`。
- **状态标签**：`tagType` ∈ `pub`(公开/绿) / `local`(本地预览/黄) / `soon`(占位/灰)。

---

## 4. 数据模型

### `APPS` 数组（主卡片）
```js
{ group:'tools'|'columns', title, ico, desc, url, tag, tagType }
```
- `group` 决定归属哪个分组渲染。
- `url` 为空 → 渲染为置灰占位卡。
- 选股功能子工具用**绝对外链**；栏目最新期用**相对路径**（`columns/xxx.html`，随 portal 同沙箱）。

### `COLUMNS_ARCHIVE` 数组（历史归档）
```js
{ date:'YYYY-MM-DD', type:'strategy'|'momentum', typeLabel:'周策略'|'动量选股', title, file:'columns/xxx.html' }
```
- 渲染进栏目分组下的「历史栏目」列表。
- 新增一期：把 HTML 放进 `columns/` 并在本数组加一行（同时若是最新期，更新 `APPS` 对应卡片的 `url`）。

---

## 5. 栏目自包含策略（关键设计）

**问题**：栏目历史内容原散落本地，唯一公网部署（旧 sandbox `04bf5fe9`）会随平台回收沙箱而失效，无法稳定"保留历史链接"。

**方案**：把历史栏目 HTML 直接打包进 `portal/columns/`，随聚合页**同一沙箱**部署。这样：
- 栏目（最新 + 历史）完全自包含，**不依赖任何外部沙箱**，链接稳定。
- 历史 HTML 均为自包含文件（无外部 `<link>/<script>`，图片走 base64 内联），跨路径服务不会破图。

> 已打包 6 期（约 1.9MB）：周策略 08-06/08-10/08-16 + 动量选股 08-07/08-08/08-14。

---

## 6. 部署

- 工具：`workbuddy_cloudstudio_deploy`，`action:'deploy'`，`directory: D:\Workbuddy Space\us-stock-screener\portal`
- **同目录复用 sandbox** → 总入口 URL 固定为 `https://7e7ae130f67b430c8793fadf3f6e23f1.app.workbuddy.link`，重部署不变。
- `columns/` 随目录一并上传，无需单独部署。
- CloudStudio 沙箱保留已部署快照，**独立于本地文件**：本地 `index.html` 误删也不影响线上，可从线上 `curl` 拉回。

---

## 7. 扩展指南

| 场景 | 操作 |
|---|---|
| 新增选股工具 | `APPS` 加一行 `{group:'tools', ...}` |
| 新增一期栏目（最新） | HTML 放 `columns/` → `APPS` 改对应卡片 `url` + `COLUMNS_ARCHIVE` 加一行 |
| 补历史归档 | HTML 放 `columns/` → `COLUMNS_ARCHIVE` 加一行 |
| 拆分/合并栏目 | 调整 `APPS` 中 `group:'columns'` 的条目与对应 `url` |

改完 `index.html` / 增删 `columns/` 后，重部署 `portal/` 目录即可。

---

## 8. 已知约束与坑

1. **选股功能外链易失效**：fd07ae3 / 9e305f… / cc602ab… 均为独立沙箱部署，平台回收后变 400/超时。**勿把公网 URL 写死进任何自动化 prompt**；卡片打不开时「重部署 XX」。
2. **主选股器本地 8766 旧代码**：运行中的 24/7 任务若仍是旧 `us_metrics_scan.py`，其 AUTO_REFRESH 会用进程内旧代码重写 `static_dist_pub`，可能把已移除的"异动"模块重新生成并覆盖。需在本机 `taskschd.msc` 对 `MeiGu_Xuangu_StockScreener` 执行 `/end` 再 `/run` 加载新源码（沙箱 `schtasks` 禁用）。
3. **本地 `index.html` 与线上快照分离**：线上由 CloudStudio 沙箱托管，本地文件仅为源；本地丢失可从线上拉回，重部署会刷新线上。
4. **`columns/` 体积**：历史报告含 base64 图，单文件最大 ~630KB，合计 ~1.9MB，重部署会一并上传（可接受，远小于画廊 155MB 上限）。

---

## 9. 文件清单

```
portal/
├── index.html              # 聚合页主体（数据驱动）
├── README.md               # 模块入口 / 快速上手
├── DESIGN.md               # 本文档
└── columns/                # 栏目历史 HTML（自包含、随 portal 部署）
    ├── us_market_report_2026-08-06.html
    ├── us_market_report_2026-08-10.html
    ├── us_market_report_2026-08-16.html
    ├── momentum_column_2026-08-07.html
    ├── momentum_column_2026-08-08.html
    └── momentum_column_2026-08-14.html
```

---

## 10. 相关链接与记忆
- 总入口：`https://7e7ae130f67b430c8793fadf3f6e23f1.app.workbuddy.link`
- 子工具源：`D:\Workbuddy Space\us-stock-screener\rps\`（选股器/RPS画廊/拥挤度）
- 栏目源：`D:\Workbuddy\us_weekly_pipeline\output\`
- 项目记忆：`D:\Workbuddy Space\us-stock-screener\.workbuddy\memory\`（2026-08-16 聚合页与栏目拆分记录）
