#!/usr/bin/env node

/**
 * fix-version-platforms.js
 * 修复已生成的版本文件中的平台映射错误
 * 根据 packageName 推断真实的平台，纠正 platforms key
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSIONS_DIR = path.join(__dirname, '../versions');

// 根据 packageName 推断真实的平台
function inferPlatformFromPackageName(packageName) {
  if (!packageName) return null;
  const lowerName = packageName.toLowerCase();
  if (lowerName.includes('windows') || lowerName.includes('x64-win')) {
    return 'windows-x64';
  } else if (lowerName.includes('linux') && lowerName.includes('x86')) {
    return 'linux-x86';
  } else if (lowerName.includes('mac') && lowerName.includes('arm64')) {
    return 'macos-arm64';
  } else if (lowerName.includes('mac') && (lowerName.includes('x64') || lowerName.includes('x86'))) {
    return 'macos-x86';
  }
  return null;
}

function fixVersionFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let versionData = JSON.parse(content);
    let modified = false;

    const newPlatforms = {};

    for (const [key, platformInfo] of Object.entries(versionData.platforms)) {
      const inferredPlatform = inferPlatformFromPackageName(platformInfo.packageName);

      if (inferredPlatform && inferredPlatform !== key) {
        console.log(`   修复: ${path.basename(filePath)}`);
        console.log(`      ${key} → ${inferredPlatform} (${platformInfo.packageName})`);
        newPlatforms[inferredPlatform] = platformInfo;
        modified = true;
      } else {
        newPlatforms[key] = platformInfo;
      }
    }

    if (modified) {
      versionData.platforms = newPlatforms;
      fs.writeFileSync(filePath, JSON.stringify(versionData, null, 2));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`   ❌ 处理失败: ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

function fixAllVersions() {
  console.log('🔧 修复版本文件中的平台映射...\n');

  if (!fs.existsSync(VERSIONS_DIR)) {
    console.error('❌ 未找到 versions 目录');
    process.exit(1);
  }

  const files = fs.readdirSync(VERSIONS_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('ℹ️  未找到版本文件');
    return;
  }

  let fixedCount = 0;
  for (const file of files) {
    const filePath = path.join(VERSIONS_DIR, file);
    if (fixVersionFile(filePath)) {
      fixedCount++;
    }
  }

  console.log(`\n✅ 完成！修复了 ${fixedCount}/${files.length} 个文件`);
}

fixAllVersions();
