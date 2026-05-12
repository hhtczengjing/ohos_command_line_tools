# 鸿蒙命令行工具 - 多平台自动发布系统

## 🎯 概述

完整的 **GitHub Actions 自动化工作流**，用于管理鸿蒙命令行工具的多平台版本发布。

### ✨ 核心特性

- 📦 **多平台支持**: Windows (64-bit), Linux (X86), macOS (X86), macOS (ARM)
- 🔄 **自动版本检测**: 自动识别 `versions/` 目录中的最新版本
- 🎁 **一键发布**: 点击按钮即可自动下载并发布最新版本到 GitHub Release
- 🛡️ **完整校验**: SHA256 校验和验证，确保文件完整性
- 🔐 **严格把控**: 任一平台失败则整体失败

## 📁 项目结构

```
ohos_command_line_tools/
├── .github/
│   └── workflows/
│       └── download-multiplatform-release.yml  # 自动发布 Workflow
├── versions/                                   # 版本数据目录
│   ├── 6.1.1.268.json                          # 最新版本
│   ├── 6.1.0.830.json
│   └── ... （更多版本文件）
├── README.md                                   # 本文件
└── config.json                                 # 原始数据源
```

## 🚀 快速开始

### 步骤 1: 配置华为 Cookie

首先获取有效的华为开发者 Cookie，然后在 `.github/huawei-api-config.txt` 中配置（参考 `.github/huawei-api-config.txt.example`）。

### 步骤 2: 同步版本信息

在 `sync` 目录中运行同步脚本：

```bash
cd sync

# 方式 1: 一键同步（推荐）
./auto-sync.sh

# 方式 2: 分步执行
node fetch-config.js      # 获取版本列表
node sync-versions.js     # 同步版本并获取下载链接
```

这会：
1. 从华为 API 获取最新版本列表 → 生成 `config.json`
2. 为每个版本的每个平台获取实时下载链接 → 更新 `../versions/` 中的版本文件

### 步骤 3: 触发 Release 发布

1. 进入 GitHub 仓库 → **Actions** 选项卡
2. 选择 **"Download Multi-Platform and Release"**
3. 点击 **"Run workflow"** 按钮

Workflow 会自动：
- ✅ 检测 `versions/` 目录中的最新版本
- ✅ 下载该版本的所有平台文件
- ✅ 验证 SHA256 校验和
- ✅ 创建 GitHub Release
- ✅ 上传所有文件到 Release

## 📝 版本文件格式

自动生成的版本文件位于 `versions/{buildVersion}.json`，格式如下：

```json
{
  "versionName": "Command Line Tools 6.1.1 Beta1",
  "buildVersion": "6.1.1.268",
  "publishTime": "2026-04-30 01:17:18",
  "versionId": "101777511964767025",
  "platforms": {
    "windows-x64": {
      "showName": "Command Line Tools for Windows 6.1.1.268",
      "packageName": "commandline-tools-windows-x64-6.1.1.268.zip",
      "downloadUrl": "https://...",
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

### 字段说明

### 支持的平台

| 平台 | platform_id |
|------|------------|
| Windows 64-bit | `windows-x64` |
| Linux X86 | `linux-x86` |
| macOS X86 | `macos-x86` |
| macOS ARM64 | `macos-arm64` |

## 🔗 使用 Release 文件

### 直接下载

```bash
# 下载指定版本
wget https://github.com/{owner}/{repo}/releases/download/6.1.1.268/commandline-tools-windows-x64-6.1.1.268.zip
```

### 在 Workflow 中使用

```yaml
- name: Download OHOS CLI
  run: |
    wget https://github.com/{owner}/{repo}/releases/download/6.1.1.268/commandline-tools-linux-x86-6.1.1.268.zip
    unzip commandline-tools-linux-x86-6.1.1.268.zip
```

### GitHub API

```bash
# 获取最新 Release
curl -s https://api.github.com/repos/{owner}/{repo}/releases/latest | jq '.assets[]'
```

## ⚠️ 重要说明

### 失败策略

- 任何平台的下载失败 → **整个任务失败**
- 任何平台的 SHA256 校验失败 → **整个任务失败**
- 重试机制：失败平台会自动重试 3 次

### 文件命名

上传到 Release 的文件名直接使用 `packageName`，例如：
- `commandline-tools-windows-x64-6.1.1.268.zip`
- `commandline-tools-linux-x86-6.1.1.268.zip`
- `commandline-tools-macos-x86-6.1.1.268.zip`
- `commandline-tools-macos-arm64-6.1.1.268.zip`

## 📞 故障排查

### 检查版本文件

使用 [JSONLint](https://jsonlint.com/) 验证 `versions/` 中的 JSON 文件格式

### 常见问题

| 问题 | 解决方案 |
|------|--------|
| 未找到版本文件 | 确保 `versions/` 目录存在且包含至少一个 `.json` 文件 |
| JSON 格式错误 | 用 JSONLint 验证文件格式 |
| 下载失败 | 在浏览器中测试 URL，确保链接有效 |
| SHA256 校验失败 | 验证 JSON 中的 SHA256 值是否正确 |

## 📄 许可证

此项目代码可自由使用和修改。

---

**更新日期**: 2026-05-12
**版本**: v2.0.0
