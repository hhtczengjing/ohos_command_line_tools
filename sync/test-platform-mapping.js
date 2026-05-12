#!/usr/bin/env node

/**
 * test-platform-mapping.js
 * 验证所有版本文件中的平台映射是否正确
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSIONS_DIR = path.join(__dirname, '../versions');

const EXPECTED_PLATFORMS = ['windows-x64', 'linux-x86', 'macos-x86', 'macos-arm64'];

const PLATFORM_PATTERNS = {
  'windows-x64': /windows/i,
  'linux-x86': /linux.*x86|x86.*linux/i,
  'macos-x86': /mac.*x64|x64.*mac|mac.*x86/i,
  'macos-arm64': /arm64|arm/i
};

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const versionData = JSON.parse(content);
    let errors = [];

    for (const [key, platformInfo] of Object.entries(versionData.platforms)) {
      if (!EXPECTED_PLATFORMS.includes(key)) {
        errors.push(`  ❌ 未知的平台 key: '${key}'`);
        continue;
      }

      const packageName = platformInfo.packageName;
      const pattern = PLATFORM_PATTERNS[key];

      if (!pattern.test(packageName)) {
        errors.push(`  ❌ ${key}: packageName 不匹配 ('${packageName}')`);
      }
    }

    if (errors.length > 0) {
      console.log(`❌ ${path.basename(filePath)}`);
      errors.forEach(e => console.log(e));
      return false;
    }
    return true;
  } catch (error) {
    console.error(`❌ ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

function testAll() {
  console.log('🧪 验证平台映射...\n');

  const files = fs.readdirSync(VERSIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  let passCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(VERSIONS_DIR, file);
    if (validateFile(filePath)) {
      passCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n✅ 通过: ${passCount}/${files.length}`);
  if (failCount > 0) {
    console.log(`❌ 失败: ${failCount}/${files.length}`);
    process.exit(1);
  }
}

testAll();
