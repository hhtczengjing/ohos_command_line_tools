# Sync 目录 - 版本链接同步系统

此目录包含华为 API 同步脚本，用于自动获取和更新版本信息及下载链接。

## 快速开始

### 1. 配置华为 Cookie

你需要获取有效的华为开发者账户 Cookie。

**选项 A: 环境变量（推荐用于 CI/CD）**
```bash
export HUAWEI_COOKIE="your_cookie_here"
node fetch-config.js
```

**选项 B: 配置文件（本地使用）**
在 `.github/huawei-api-config.txt` 中配置：
```
COOKIE=urlBeforeLogin=...;state=...;CASLOGINSITE=1;...
```

### 2. 一键同步（推荐）

```bash
cd sync
./auto-sync.sh
```

这会自动执行以下步骤，生成最新的版本信息：

```
fetch-config.js  →  config.json  →  sync-versions.js  →  ../versions/{version}.json  →  update-version.js  →  ../VERSION
```

### 3. 分步执行（用于调试）

如果需要分步执行或调试，可以逐个运行：

```bash
# 步骤 1: 获取版本列表
node fetch-config.js

# 步骤 2: 同步版本并获取下载链接
node sync-versions.js

# 步骤 3: 生成 VERSION 文件
node update-version.js
```

## 脚本详解

### fetch-config.js

调用华为 API 的 `getToolVersionList` 接口获取完整版本列表。

**功能:**
- 读取 Cookie（从 `.github/huawei-api-config.txt` 或环境变量 `HUAWEI_COOKIE`）
- 调用华为 API 获取所有版本的完整信息
- 保存为 `config.json`（华为 API 原始数据）

**使用:**
```bash
node fetch-config.js
```

**错误处理:**
- 如果未找到 Cookie，会提示配置位置
- 如果 API 返回错误，会显示详细错误信息

---

### sync-versions.js

从 `config.json` 提取版本信息，为每个版本/平台获取实时下载链接。

**功能:**
- 读取 `config.json` 中的版本列表
- 遍历所有版本和所有平台（osType 1-4）
- 为每个版本/平台调用 `getToolVersionDownloadUrl` 接口获取真实下载链接
- 生成版本 JSON 文件到 `../versions/` 目录

**使用:**
```bash
node sync-versions.js
```

**平台识别:**
| osType | 平台 | platform_id |
|--------|------|-----------|
| 1 | Windows 64-bit | `windows-x64` |
| 2 | Linux X86 | `linux-x86` |
| 3 | macOS X86 | `macos-x86` |
| 4 | macOS ARM64 | `macos-arm64` |

**输出文件示例:**

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

---

### update-version.js

生成 `VERSION` 文件，记录最新非Beta版本号。

**功能:**
- 读取 `../versions/` 目录中所有版本 JSON 文件
- 解析版本名称，筛选出非Beta版本（不包含 "Beta" 字样）
- 找出版本号最大的非Beta版本
- 生成 `../VERSION` 文件（仅包含 buildVersion）

**使用:**
```bash
node update-version.js
```

**输出示例:**
```
6.1.0.830
```

**版本号规则:**
- **非Beta版本**: `Command Line Tools 6.1.0 Release` ✅
- **Beta版本**: `Command Line Tools 6.1.1 Beta1` ❌（会被过滤）

---

## auto-sync.sh

一键执行所有同步步骤的 Bash 脚本。

**功能:**
- 顺序执行 fetch-config.js、sync-versions.js、update-version.js
- 检查每一步的执行结果，失败则停止
- 显示最终结果

**使用:**
```bash
./auto-sync.sh
```

**输出示例:**
```
✓ Fetching config from API...
✓ Syncing versions and download URLs...
✓ Updating VERSION file: 6.1.0.830
All sync tasks completed successfully!
```

---

## 常见问题

### Cookie 已过期

华为 Cookie 通常有 7-10 天的有效期。如果看到 API 错误 "accesstoken expired"，需要更新 Cookie。

**获取新 Cookie 的步骤:**
1. 访问 https://developer.huawei.com/consumer/cn/download/command-line-tools-for-hmos
2. 打开浏览器开发者工具（F12），切换到 "Application" 或 "Storage" 标签
3. 查看 Cookies，复制所有 Cookie 值
4. 更新 `.github/huawei-api-config.txt` 或 GitHub Actions secrets

### 某个平台的下载 URL 获取失败

脚本会继续处理其他平台，但会显示警告。可能原因：
- Cookie 权限不足或已过期
- 该平台在该版本不可用
- API 暂时不可用

### 版本文件结构不对

运行 `sync-versions.js` 时，会自动识别平台（根据 osType）并生成正确的版本文件结构。

## 工作流程

```
┌─────────────────────┐
│  fetch-config.js    │  从华为 API 获取版本列表
│   + HUAWEI_COOKIE   │
└──────────┬──────────┘
           ↓
    ┌─────────────────┐
    │  config.json    │  华为 API 原始数据
    └────────┬────────┘
             ↓
┌──────────────────────────┐
│  sync-versions.js        │  为版本获取实时下载链接
│  (遍历所有平台)          │
└──────────┬───────────────┘
           ↓
┌──────────────────────────────────┐
│  ../versions/{version}.json       │  版本信息及下载链接
└────────────┬─────────────────────┘
             ↓
┌──────────────────────┐
│  update-version.js   │  生成最新版本文件
└──────────┬───────────┘
           ↓
    ┌─────────────────┐
    │  ../VERSION     │  最新非Beta版本号
    └─────────────────┘
```

## 与 GitHub Actions 的集成

这些脚本可以在 GitHub Actions 中运行（支持 Cookie 通过 secrets 或 workflow_dispatch 输入）：

```yaml
- name: Sync versions from Huawei API
  run: |
    cd sync
    ./auto-sync.sh
  env:
    HUAWEI_COOKIE: ${{ secrets.HUAWEI_COOKIE }}
```

或在 workflow_dispatch 中手动输入 Cookie：

```yaml
- name: Sync with manual Cookie input
  run: |
    cd sync
    ./auto-sync.sh
  env:
    HUAWEI_COOKIE: ${{ github.event.inputs.cookie }}
```

---

**更新日期**: 2026-05-12
**脚本状态**: ✅ 所有脚本正常工作
