# Sync 目录

此目录包含华为 API 同步脚本，用于自动获取和更新版本信息。

## 快速开始

### 1. 配置华为 Cookie

首先，你需要获取有效的华为开发者账户 Cookie。

在 `.github/huawei-api-config.txt` 中配置（格式如下）：

```
COOKIE=urlBeforeLogin=...;state=...;CASLOGINSITE=1;LOGINACCSITE=1;HuaweiID_CAS_ISCASLOGIN=true;HWWAFSESID=...;HWWAFSESTIME=...;csrfToken=...;x-siteId=1;x-country=CN;X-HD-SESSION=...;x-hd-grey=...;authInfo=...;authdata=...;developer_userinfo=...;developer_userdata=...
```

或者设置环境变量：
```bash
export HUAWEI_COOKIE="..."
```

### 2. 获取版本列表（生成 config.json）

```bash
cd sync
node fetch-config.js
```

**输出:**
- `sync/config.json` - 华为 API 返回的完整版本列表

### 3. 同步版本并获取实时下载链接

```bash
node sync-versions.js
```

**流程:**
1. 读取 `config.json` 中的版本信息
2. 为每个版本的每个平台调用华为 API 获取真实下载链接
3. 生成/更新 `../versions/{buildVersion}.json` 文件

**输出:**
- `../versions/6.1.1.268.json` - 包含真实下载链接的版本文件
- `../versions/6.1.0.830.json` - 其他版本...

## 脚本详解

### fetch-config.js

调用华为 API 的 `getToolVersionList` 接口获取版本列表。

**功能:**
- 读取 Cookie（从 `.github/huawei-api-config.txt` 或环境变量）
- 调用华为 API 获取完整版本信息
- 保存为 `config.json`

**使用:**
```bash
node fetch-config.js
```

**错误处理:**
- 如果未找到 Cookie，会提示配置位置
- 如果 API 返回错误，会显示错误信息

---

### sync-versions.js

从 `config.json` 提取版本信息，并通过华为 API 获取真实下载链接。

**功能:**
- 读取 `config.json`
- 遍历所有版本和平台
- 为每个平台调用 `getToolVersionDownloadUrl` 接口获取真实下载链接
- 生成版本 JSON 文件到 `../versions/` 目录

**使用:**
```bash
node sync-versions.js
```

**平台识别:**
- `windows-x64` - Windows 64-bit
- `linux-x86` - Linux X86
- `macos-x86` - macOS X86
- `macos-arm64` - macOS ARM64

**输出文件格式:**
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
      "sha256": "40cc0d...",
      "packageSize": "2599585816",
      "sdkId": "5cdf203ab5634a4cace4359c6034db7e",
      "packageId": "101777511964767027"
    },
    ...
  }
}
```

---

## 常见问题

### Cookie 已过期

华为 Cookie 通常有 7-10 天的有效期。如果看到 API 错误，需要更新 Cookie。

**步骤:**
1. 访问 https://developer.huawei.com/consumer/cn/download/command-line-tools-for-hmos
2. 打开浏览器开发者工具，复制 Cookie
3. 更新 `.github/huawei-api-config.txt`

### 某个平台的下载 URL 获取失败

脚本会继续处理其他平台，但会显示警告。

可能原因：
- Cookie 权限不足
- 该平台在该版本不可用
- API 暂时不可用

### 版本文件结构不对

运行 `sync-versions.js` 时，会自动识别平台并生成正确的版本文件结构。

## 工作流程

```
fetch-config.js          sync-versions.js         ../versions/
(获取版本列表)    →    (获取真实下载链接)    →  (生成版本文件)
     ↓                          ↓                      ↓
config.json              更新每个平台的         6.1.1.268.json
(华为 API 原始)          downloadUrl            6.1.0.830.json
```

## 与 GitHub Actions 的集成

这些脚本可以在 GitHub Actions 中定时运行：

```yaml
- name: Fetch and sync versions
  run: |
    cd sync
    node fetch-config.js
    node sync-versions.js
  env:
    HUAWEI_COOKIE: ${{ secrets.HUAWEI_COOKIE }}
```

生成的版本文件会被 `../scripts/detect-version.sh` 和 `../scripts/download-platforms.sh` 使用。
