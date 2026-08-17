# 美股研究终端 · 聚合页（Portal）

> 本目录是「美股研究终端」的**统一导航入口**，作为独立子项目维护，与主选股器逻辑（`rps/`）解耦。
> 完整设计规格见 [`DESIGN.md`](./DESIGN.md)。

## 这是什么
一个纯静态单页（`index.html`），把分散在各个沙箱的子工具与定期栏目聚合成一个总入口。
- **选股功能**：你操作的工具（美股选股器 / RPS 画廊 / 美股拥挤度 / 模拟盘占位）
- **栏目**：你阅读的定期内容（周策略 / 动量选股 + 历史栏目归档）

## 总入口（已部署）
**https://7e7ae130f67b430c8793fadf3f6e23f1.app.workbuddy.link**

栏目区（最新 + 历史）已打包进本站 `columns/`，链接稳定；选股功能子工具为外链，可能因沙箱回收临时失效。

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
用 CloudStudio 部署 `portal/` 目录（同目录 → 复用同一 sandbox，总入口 URL 不变）：
- 工具：`workbuddy_cloudstudio_deploy`，action=`deploy`，directory=`D:\Workbuddy Space\us-stock-screener\portal`
- 历史 HTML 随目录一并上传，无需单独部署。

## 注意事项
- ⚠️ 选股功能子工具的外链（fd07ae3 / 9e305f… / cc602ab…）随平台回收沙箱可能失效，**勿写死进任何自动化 prompt**；某卡片打不开时「重部署 XX」即可。
- 本地 `index.html` 若丢失，可从线上拉回（`curl 总入口 -o portal/index.html`），CloudStudio 沙箱保留已部署快照、独立于本地文件。
- `columns/` 体积约 1.9MB（历史报告含 base64 内联图），重部署会一并上传，属可接受范围。
