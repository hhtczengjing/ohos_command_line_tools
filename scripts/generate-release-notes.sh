#!/bin/bash
# Release Notes 生成脚本
# 用法: ./scripts/generate-release-notes.sh <version_file> <build_version>

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ 错误: 缺少必需参数"
  echo "用法: ./scripts/generate-release-notes.sh <version_file> <build_version>"
  exit 1
fi

version_file="$1"
build_version="$2"

# 从版本 JSON 中提取版本名称和发布时间
version_name=$(jq -r '.versionName // "Command Line Tools"' "$version_file")
publish_time=$(jq -r '.publishTime // ""' "$version_file")

release_notes="# $version_name (Build $build_version)"$'\n\n'

if [ -n "$publish_time" ]; then
  release_notes="${release_notes}**发布时间**: $publish_time"$'\n\n'
fi

release_notes="${release_notes}## 📦 包含的平台版本"$'\n\n'

jq -r '.platforms | to_entries[] | "- **\(.value.showName // .key)** (\(.key))"' "$version_file" >> release_notes_tmp.txt || true

if [ -f release_notes_tmp.txt ]; then
  cat release_notes_tmp.txt >> release_notes.txt
fi

echo "$release_notes" > release_notes.txt

echo "✅ Release Notes 生成成功"
cat release_notes.txt

# 清理临时文件
rm -f release_notes_tmp.txt
