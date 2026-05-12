#!/bin/bash
# 从华为 API 获取真实下载链接
# 用法: ./scripts/fetch-download-urls.sh <version_file> <sdkId> <versionId> <packageId>

set -e

if [ -z "$1" ]; then
  echo "❌ 错误: 缺少必需参数"
  echo "用法: ./scripts/fetch-download-urls.sh <version_file> [sdkId versionId packageId...]"
  echo ""
  echo "示例："
  echo "  ./scripts/fetch-download-urls.sh versions/6.1.1.268.json 5cdf203ab5634a4cace4359c6034db7e 101777511964767025 101777511964767027"
  exit 1
fi

version_file="$1"

# 如果未提供 SDK/Version/Package ID，从 JSON 中提取
if [ -z "$2" ]; then
  echo "从 JSON 文件中提取平台信息..."
  
  # 创建临时版本文件备份
  cp "$version_file" "$version_file.bak"
  
  # 逐个处理每个平台
  jq -r '.platforms | to_entries[] | "\(.key)|\(.value.sdkId)|\(.value.versionId)|\(.value.packageId // empty)"' "$version_file" | while IFS='|' read -r platform_id sdkId versionId packageId; do
    if [ -z "$sdkId" ] || [ -z "$versionId" ] || [ -z "$packageId" ]; then
      echo "⚠️ 跳过 $platform_id: 缺少必需的 SDK/Version/Package ID"
      continue
    fi
    
    echo "📥 正在获取 $platform_id 的下载链接..."
    echo "   sdkId: $sdkId"
    echo "   versionId: $versionId"
    echo "   packageId: $packageId"
  done
else
  # 使用命令行参数
  sdkId="$2"
  versionId="$3"
  packageId="$4"
  
  echo "📥 正在获取下载链接..."
  echo "   sdkId: $sdkId"
  echo "   versionId: $versionId"
  echo "   packageId: $packageId"
fi

echo ""
echo "⚠️  注意: 此脚本需要有效的华为开发者账户 Cookie"
echo "请先在浏览器中登录 https://developer.huawei.com/，然后更新脚本中的 Cookie"
