# OHOS 命令行工具版本管理系统

一套完整的华为鸿蒙 Command Line Tools 版本链接同步系统。自动从华为开发者中心获取最新版本信息和下载链接，并维护版本清单。

## 📋 项目结构

```
ohos_command_line_tools/
├── README.md                           # 项目文档
├── VERSION                             # 最新版本号（自动生成）
├── .gitignore                          # Git 忽略规则
├── .github/
│   └── huawei-api-config.txt.example   # Cookie 配置示例
└── sync/                               # 版本同步系统
    ├── package.json                    # Node.js 依赖配置
    ├── README.md                       # 同步脚本详细文档
    ├── fetch-config.js                 # 脚本 1：获取版本列表
    ├── sync-versions.js                # 脚本 2：提取版本 + 获取下载链接
    ├── update-version.js               # 脚本 3：生成版本文件
    ├── auto-sync.sh                    # 一键同步脚本
    ├── config.json                     # 华为 API 原始数据（自动生成）
    └── node_modules/                   # npm 依赖
└── versions/                           # 版本清单（自动生成）
    ├── 5.0.3.906.json
    ├── 5.0.5.310.json
    ├── ...
    └── 6.1.0.830.json
```

## 🚀 快速开始

### 前置条件
- Node.js 12.0+
- 华为开发者账户和有效的 Cookie

### 1. 配置华为 Cookie

在 `.github/huawei-api-config.txt` 中配置你的 Cookie：

```bash
COOKIE=urlBeforeLogin=...;state=...;CASLOGINSITE=1;...
```

或者使用环境变量：
```bash
export HUAWEI_COOKIE="your_cookie_here"
```

### 2. 一键同步（推荐）

```bash
cd sync
./auto-sync.sh
```

自动执行完整流程：
1. 获取华为 API 版本列表 → `config.json`
2. 提取版本信息并获取下载链接 → `versions/{version}.json`
3. 生成最新版本号 → `../VERSION`

### 3. 分步执行（用于调试）

```bash
cd sync

# 步骤 1：获取版本列表
node fetch-config.js

# 步骤 2：提取版本并获取下载链接
node sync-versions.js

# 步骤 3：生成版本文件
node update-version.js
```

## 📚 核心脚本说明

### fetch-config.js - 获取版本列表

调用华为 API 的 `getToolVersionList` 接口，获取所有版本信息。

**输出**: `sync/config.json`（华为 API 原始数据）

```bash
node fetch-config.js
```

**功能**:
- 读取 Cookie（从 `.github/huawei-api-config.txt` 或环境变量）
- 调用华为 API 获取版本列表
- 保存完整的 API 响应数据

### sync-versions.js - 同步版本和下载链接

从 `config.json` 提取版本信息，为每个版本/平台获取实时下载链接。

**输出**: `versions/{buildVersion}.json`（每个版本一个文件）

```bash
node sync-versions.js
```

**功能**:
- 解析 `config.json` 中的版本列表
- 遍历所有版本和平台（osType 1-4）
- 为每个版本/平台调用 `getToolVersionDownloadUrl` 获取真实下载链接
- 生成标准化的版本信息 JSON 文件

**平台映射**:
| osType | 平台 | 标识 |
|--------|------|------|
| 1 | Windows 64-bit | `windows-x64` |
| 2 | Linux X86 | `linux-x86` |
| 3 | macOS Intel | `macos-x86` |
| 4 | macOS Apple Silicon | `macos-arm64` |

**输出文件示例** (`versions/6.1.0.830.json`):
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

### update-version.js - 生成版本文件

从 `versions/` 目录中找出最新的非 Beta 版本，生成 `VERSION` 文件。

**输出**: `../VERSION`（仅包含版本号）

```bash
node update-version.js
```

**功能**:
- 扫描 `versions/` 目录的所有版本文件
- 筛选非 Beta 版本（排除版本名称中含 "Beta" 的版本）
- 找出版本号最大的版本
- 生成 `VERSION` 文件

**版本过滤规则**:
- ✅ 保留: `Command Line Tools 6.1.0 Release`
- ❌ 排除: `Command Line Tools 6.1.1 Beta1`

## 📦 版本清单

所有版本信息存储在 `versions/` 目录中，每个版本一个独立的 JSON 文件：

```
versions/
├── 5.0.3.906.json      # v5.0.3
├── 5.0.5.310.json      # v5.0.5
├── 5.0.7.210.json      # v5.0.7
├── 5.0.9.310.json      # v5.0.9
├── 5.0.11.110.json     # v5.0.11
├── 5.0.13.240.json     # v5.0.13
├── 6.0.0.878.json      # v6.0.0
├── 6.0.1.251.json      # v6.0.1 (Rev1)
├── 6.0.1.268.json      # v6.0.1 (Rev2)
├── 6.0.2.650.json      # v6.0.2
├── 6.1.0.830.json      # v6.1.0
└── 6.1.1.268.json      # v6.1.1 Beta
```

每个版本文件包含该版本在所有平台（Windows、Linux、macOS Intel、macOS ARM64）上的完整下载信息。

## ⚙️ npm 脚本

在 `sync/` 目录运行：

```bash
npm run sync              # 一键同步所有步骤
npm run fetch             # 仅获取版本列表
npm run sync-versions     # 仅同步版本和链接
npm run update-version    # 仅生成版本文件
```

## 🔄 完整工作流程

```
┌────────────────────┐
│  fetch-config.js   │  从华为 API 获取版本列表
│  + HUAWEI_COOKIE   │
└──────────┬─────────┘
           ↓
    ┌───────────────┐
    │ config.json   │  华为 API 原始数据
    └────────┬──────┘
             ↓
┌──────────────────────┐
│ sync-versions.js     │  为每个版本/平台获取下载链接
└──────────┬───────────┘
           ↓
┌──────────────────────────────┐
│ versions/{version}.json       │  完整版本信息
└────────────┬─────────────────┘
             ↓
┌──────────────────────┐
│ update-version.js    │  生成最新版本号
└──────────┬───────────┘
           ↓
    ┌───────────────┐
    │  VERSION      │  最新非Beta版本号
    └───────────────┘
```

## 🔐 安全性

- **Cookie 配置**: 敏感信息（`.github/huawei-api-config.txt`）已被 `.gitignore` 保护
- **环境变量**: 支持通过 `HUAWEI_COOKIE` 环境变量传递 Cookie（推荐用于 CI/CD）
- **生成文件**: 所有自动生成的文件（`config.json`、`versions/`、`VERSION`）可安全提交到 Git

## 🛠️ 与 GitHub Actions 集成

脚本可以在 GitHub Actions Workflow 中运行。示例配置：

```yaml
- name: Sync versions from Huawei API
  run: |
    cd sync
    ./auto-sync.sh
  env:
    HUAWEI_COOKIE: ${{ secrets.HUAWEI_COOKIE }}
```

## 🐛 故障排查

### Cookie 已过期

华为 Cookie 通常有 7-10 天的有效期。如果看到 API 错误 "accesstoken expired"：

1. 访问 https://developer.huawei.com/consumer/cn/download/command-line-tools-for-hmos
2. 打开浏览器开发者工具（F12），切换到 "Storage" → "Cookies"
3. 复制所有 Cookie 值
4. 更新 `.github/huawei-api-config.txt` 中的 COOKIE 值

### 某个平台的下载链接获取失败

脚本会继续处理其他平台并显示警告。可能原因：
- Cookie 权限不足或已过期
- 该平台在该版本不可用
- API 暂时不可用

### API 连接错误

检查：
- 网络连接是否正常
- Cookie 是否有效
- 华为开发者中心是否可访问

## 📄 主要文件说明

| 文件 | 说明 |
|------|------|
| `VERSION` | 最新非Beta版本号（自动生成）|
| `sync/config.json` | 华为 API 原始数据（自动生成）|
| `sync/package.json` | npm 依赖配置 |
| `sync/fetch-config.js` | 获取版本列表脚本 |
| `sync/sync-versions.js` | 同步版本和链接脚本 |
| `sync/update-version.js` | 生成版本文件脚本 |
| `sync/auto-sync.sh` | 一键同步脚本 |
| `versions/*.json` | 版本清单（自动生成）|
| `.github/huawei-api-config.txt` | Cookie 配置（敏感，本地仅用）|
| `.gitignore` | Git 忽略规则 |
