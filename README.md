# 美股研究终端 · 聚合页（Portal）

> 本目录是「美股研究终端」的**统一导航入口**，作为独立子项目维护，与主选股器逻辑（`rps/`）解耦。
> 完整设计规格见 [`DESIGN.md`](./DESIGN.md)。

## 这是什么
一个纯静态单页（`index.html`），把分散在各个沙箱的子工具与定期栏目聚合成一个总入口。
- **选股功能**：你操作的工具（美股选股器 / RPS 画廊 / 美股拥挤度 / 模拟盘占位）
- **栏目**：你阅读的定期内容（周策略 / 动量选股 + 历史栏目归档）

## 总入口（已部署 · 固定网址）
**https://yueling-buddy.github.io/us-stock-portal/**

> 托管于 GitHub Pages（仓库 `yueling-buddy/us-stock-portal`，main 分支）。地址与仓库绑定、**永不变、不过期**，彻底告别之前 CloudStudio 沙箱被回收导致「workspace not ready / 域名失效」的问题。
> 旧 CloudStudio 聚合页 `7e7ae130…app.workbuddy.link` 已弃用下线。

栏目区（最新 + 历史）已打包进本站根目录，链接稳定；选股功能子工具为外链，可能因沙箱回收临时失效（统一在 `tools.json` 维护，换链只改它）。

## 目录结构
```
portal/
├── index.html          # 聚合页主体（数据驱动，改数组即可）
├── DESIGN.md           # 完整设计规格
└── columns/            # 栏目历史 HTML 打包（随 portal 同沙箱部署，自包含）
    ├── us_market_report_YYYY-MM-DD.html   # 周策略（整体市场解读）
    └── momentum_column_YYYY-MM-DD.html    # 动量选股（个股筛选）
```

## 快速上手（改完重部署即可生效）
- **加一个选股工具**：编辑 `index.html` 的 `APPS` 数组，加一行 `{group:'tools', ...}`。
- **加一期栏目（最新）**：把对应 HTML 放进 `columns/`，并在 `APPS` 与 `COLUMNS_ARCHIVE` 各加一行。
- **补一期历史归档**：把 HTML 放进 `columns/`，在 `COLUMNS_ARCHIVE` 加一行。

## 部署
推送 `portal/` 目录到 GitHub 仓库 `yueling-buddy/us-stock-portal`（main 分支根目录），GitHub Pages 自动发布：
- 脚本：`portal-design/deploy_github.py`（走 GitHub Contents API，规避本沙箱 git `receive-pack` 被阻断的问题）
- 用法：`export GH_TOKEN='ghp_xxx'` 后 `python portal-design/deploy_github.py`
- 幂等：文件已存在则 update（带 sha），不存在则 create；仓库仓库绑定，地址不变。
- 首次/更新后约 1 分钟生效。

## 注意事项
- ⚠️ 选股功能子工具的外链（fd07ae3 / 9e305f… / cc602ab…）随平台回收沙箱可能失效，**勿写死进任何自动化 prompt**；某卡片打不开时「重部署 XX」即可。换链只改 `tools.json` 后重跑 `deploy_github.py`。
- **本地 `portal/` 是权威源**：与 CloudStudio 不同，GitHub Pages 是 push 模式，本地改完推上去即生效，不存在「本地源被部署回同步覆盖」的问题。
- `og:image` 已用相对路径 `og-image.png`，门户 host 无关，换任何托管方都无需再改。
