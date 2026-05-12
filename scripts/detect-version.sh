#!/bin/bash
# 版本检测脚本
# 用法: ./scripts/detect-version.sh

set -e

# 查找 versions/ 目录中的最新版本文件
latest_version_file=$(ls -1 versions/*.json 2>/dev/null | sort -V | tail -1)

if [ -z "$latest_version_file" ]; then
  echo "❌ 错误: 未找到任何版本文件在 versions/ 目录中"
  exit 1
fi

# 验证 JSON 格式并提取 buildVersion
build_version=$(jq -r '.buildVersion // empty' "$latest_version_file" 2>/dev/null)

if [ -z "$build_version" ]; then
  echo "❌ 错误: 无法从版本文件中提取 buildVersion"
  exit 1
fi

echo "✅ 检测到最新版本: $build_version"
echo "version_file=$latest_version_file"
echo "build_version=$build_version"
