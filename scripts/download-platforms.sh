#!/bin/bash
# 多平台文件下载脚本
# 用法: ./scripts/download-platforms.sh <version_file> <build_version>

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ 错误: 缺少必需参数"
  echo "用法: ./scripts/download-platforms.sh <version_file> <build_version>"
  exit 1
fi

version_file="$1"
build_version="$2"
mkdir -p downloads

# 初始化计数器
total_platforms=0
successful_platforms=0

# 读取版本 JSON 文件中的平台列表
# 使用进程替换 (< <(...)) 而不是管道 (|) 来避免子 shell 问题
while IFS='|' read -r platform_id platform_name url package_name expected_sha256; do
  if [ -z "$url" ]; then
    continue
  fi

  ((total_platforms++))
  echo "📥 下载 [$platform_name] ($platform_id): $url"

  # 直接使用 packageName 作为输出文件名
  output_filename="$package_name"

  # 下载文件，带重试机制
  max_attempts=3
  attempt=1
  download_success=false

  while [ $attempt -le $max_attempts ]; do
    if curl -# -L -o "downloads/$output_filename" "$url"; then
      download_success=true
      break
    fi
    if [ $attempt -lt $max_attempts ]; then
      echo "⚠️ 下载失败，重试 ($attempt/$max_attempts)..."
      sleep 2
    fi
    ((attempt++))
  done

  if [ "$download_success" = true ] && [ -f "downloads/$output_filename" ]; then
    # 验证 SHA256 校验和
    actual_sha256=$(sha256sum "downloads/$output_filename" | awk '{print $1}')

    if [ -n "$expected_sha256" ] && [ "$actual_sha256" != "$expected_sha256" ]; then
      echo "❌ SHA256 校验失败: $output_filename"
      echo "   期望: $expected_sha256"
      echo "   实际: $actual_sha256"
      rm "downloads/$output_filename"
    else
      ((successful_platforms++))
      filesize=$(du -h "downloads/$output_filename" | cut -f1)
      echo "✅ 下载成功: $output_filename ($filesize)"
      if [ -n "$expected_sha256" ]; then
        echo "✅ SHA256 校验通过"
      fi
    fi
  else
    echo "❌ 下载失败: $url"
  fi
done < <(jq -r '.platforms | to_entries[] | "\(.key)|\(.value.showName // .key)|\(.value.downloadUrl)|\(.value.packageName)|\(.value.sha256)"' "$version_file")

echo ""
echo "📊 统计信息:"
echo "   总平台数: $total_platforms"
echo "   成功: $successful_platforms"
echo "   失败: $((total_platforms - successful_platforms))"
echo ""

# 检查是否有任何平台失败
if [ "$successful_platforms" -ne "$total_platforms" ]; then
  echo "❌ 错误: 部分平台下载失败"
  exit 1
fi

echo "✅ 下载完成"
