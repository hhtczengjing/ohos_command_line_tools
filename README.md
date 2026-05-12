# 鸿蒙命令行工具 - 版本链接同步系统

## 🎯 概述

自动同步鸿蒙命令行工具的多平台版本链接配置。使用华为 API 定期获取最新版本信息和下载链接，并维护项目版本信息文件。

### ✨ 核心特性

- 📦 **多平台支持**: Windows (64-bit), Linux (X86), macOS (X86), macOS (ARM)
- 🔄 **自动版本同步**: 从华为 API 自动获取最新版本信息和下载链接
- 🎯 **VERSION 文件**: 自动维护最新非Beta版本号
- 🔐 **配置中心**: 版本信息集中存储在 `versions/` 目录

## 📁 项目结构

```
ohos_command_line_tools/
├── sync/                                  # 版本同步脚本
│   ├── fetch-config.js                   # 从华为 API 获取版本列表
│   ├── sync-versions.js                  # 为版本获取实时下载链接
│   ├── update-version.js                 # 生成 VERSION 文件
│   ├── auto-sync.sh                      # 一键同步脚本
│   └── README.md                         # Sync 文档
├── versions/                              # 版本数据目录
│   ├── 6.1.0.830.json                    # 最新非Beta版本
│   ├── 6.1.1.268.json                    # Beta 版本
│   └── ... （更多版本文件）
├── VERSION                                # 最新非Beta版本号
├── README.md                              # 本文件
└── package.json                           # 项目依赖
```

## 🚀 快速开始

### 步骤 1: 配置华为 Cookie

获取有效的华为开发者 Cookie，通过以下方式之一配置：

**方式 A: 环境变量（推荐用于 CI/CD）**
```bash
export HUAWEI_COOKIE="your_cookie_here"
```

**方式 B: 配置文件（本地使用）**
在 `.github/huawei-api-config.txt` 中设置：
```
COOKIE=urlBeforeLogin=...;state=...;...
```

### 步骤 2: 运行同步脚本

在 `sync` 目录中运行同步脚本：

```bash
cd sync

# 一键同步（推荐）
./auto-sync.sh

# 或分步执行
node fetch-config.js      # 获取版本列表
node sync-versions.js     # 为版本获取下载链接
node update-version.js    # 生成 VERSION 文件
```

脚本流程：
1. `fetch-config.js` 从华为 API 获取版本列表 → `config.json`
2. `sync-versions.js` 为每个版本/平台获取实时下载链接 → `../versions/{buildVersion}.json`
3. `update-version.js` 更新 `../VERSION` 文件（最新非Beta版本号）

### 步骤 3: 验证同步结果

```bash
# 查看最新版本号
cat VERSION

# 查看版本详情
cat versions/6.1.0.830.json
```

## 📝 版本文件格式

版本文件位于 `versions/{buildVersion}.json`，包含该版本的所有平台下载链接：

```json
{
  "versionName": "Command Line Tools 6.1.0 Release",
  "buildVersion": "6.1.0.830",
  "publishTime": "2026-04-20 10:30:00",
  "versionId": "101777511964767000",
  "platforms": {
    "windows-x64": {
      "showName": "Command Line Tools for Windows 6.1.0.830",
      "packageName": "commandline-tools-windows-x64-6.1.0.830.zip",
      "downloadUrl": "https://contentcenter-vali-drcn.dbankcdn.cn/...",
      "sha256": "40cc0d9d677406f6f8f2704107dcff89e36ed271ead357db5cef62501473f37e",
      "packageSize": "2599585816",
      "sdkId": "5cdf203ab5634a4cace4359c6034db7e",
      "packageId": "101777511964767027"
    },
    "linux-x86": { ... },
    "macos-x86": { ... },
    "macos-arm64": { ... }
  }
}
```

### 支持的平台

| 平台 | platform_id |
|------|------------|
| Windows 64-bit | `windows-x64` |
| Linux X86 | `linux-x86` |
| macOS X86 | `macos-x86` |
| macOS ARM64 | `macos-arm64` |

## 🔗 使用版本信息

版本文件可用于：

- **自动化部署**: CI/CD 流程中读取下载链接
- **版本检查**: 检查最新版本号（查看 `VERSION` 文件）
- **下载链接**: 获取各平台的最新下载链接

### 示例：获取最新下载链接

```bash
# 读取最新版本号
VERSION=$(cat VERSION)

# 获取该版本的信息
cat "versions/${VERSION}.json" | jq '.platforms.windows-x64.downloadUrl'
```

## ⚠️ 重要说明

### 版本号规则

- **非Beta版本**: 不包含 "Beta" 字样（如 6.1.0.830、6.0.2.650）
- **Beta版本**: 包含 "Beta" 字样（如 6.1.1.268）
- `VERSION` 文件始终记录最新的非Beta版本

### Cookie 管理

- Cookie 有效期：7-10 天（需定期更新）
- 敏感文件已被 `.gitignore` 保护
- 在 GitHub Actions 中使用 secrets 管理 Cookie

### 文件说明

| 文件 | 说明 |
|------|------|
| `sync/config.json` | 华为 API 原始数据（自动生成，不提交）|
| `versions/{version}.json` | 版本信息及下载链接（提交到仓库）|
| `VERSION` | 最新非Beta版本号（自动生成）|

## 📞 故障排查

### 常见问题

| 问题 | 解决方案 |
|------|--------|
| API 返回 "accesstoken expired" | Cookie 已过期，需要更新 |
| 无法读取 Cookie | 确保 `.github/huawei-api-config.txt` 存在或设置环境变量 |
| 某个平台下载链接失败 | 该平台可能在该版本不可用，脚本会跳过并继续 |
| VERSION 文件为空 | 确保 `versions/` 目录有非Beta版本文件 |

### 获取新 Cookie

1. 访问 https://developer.huawei.com/consumer/cn/download/command-line-tools-for-hmos
2. 打开浏览器开发者工具（F12），切换到 "Network" 标签
3. 刷新页面，复制请求头中的 `Cookie` 值
4. 更新 `.github/huawei-api-config.txt` 或 GitHub Actions secrets

## 📄 许可证

此项目代码可自由使用和修改。

---

**更新日期**: 2026-05-12
**版本**: v3.0.0 - 版本链接同步系统
