#!/usr/bin/env node

/**
 * Update VERSION file with the latest non-Beta version
 *
 * Reads all version JSON files from versions/ directory,
 * filters out Beta versions, and creates a VERSION file
 * containing the buildVersion of the latest non-Beta release.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionsDir = path.join(__dirname, '../versions');
const versionFilePath = path.join(__dirname, '../VERSION');

async function findLatestNonBetaVersion() {
  try {
    // Read all files in versions directory
    const files = fs.readdirSync(versionsDir).filter(file => file.endsWith('.json'));

    if (files.length === 0) {
      console.error('No version files found in versions/ directory');
      process.exit(1);
    }

    let latestNonBeta = null;
    let latestVersion = null;

    // Process each version file
    for (const file of files) {
      const filePath = path.join(versionsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const versionData = JSON.parse(content);

      const versionName = versionData.versionName || '';
      const buildVersion = versionData.buildVersion;

      // Check if this is a Beta version
      const isBeta = versionName.includes('Beta');

      if (!isBeta && buildVersion) {
        // Parse version numbers for comparison (e.g., "6.1.0.830" -> [6, 1, 0, 830])
        const versionParts = buildVersion.split('.').map(Number);

        if (!latestNonBeta) {
          latestNonBeta = buildVersion;
          latestVersion = versionParts;
        } else {
          // Compare versions part by part
          let isNewer = false;
          for (let i = 0; i < versionParts.length; i++) {
            if (versionParts[i] > latestVersion[i]) {
              isNewer = true;
              break;
            } else if (versionParts[i] < latestVersion[i]) {
              break;
            }
          }

          if (isNewer) {
            latestNonBeta = buildVersion;
            latestVersion = versionParts;
          }
        }
      }
    }

    if (!latestNonBeta) {
      console.error('No non-Beta versions found');
      process.exit(1);
    }

    // Write VERSION file
    fs.writeFileSync(versionFilePath, latestNonBeta + '\n');
    console.log(`✓ VERSION file updated: ${latestNonBeta}`);

  } catch (error) {
    console.error('Error updating VERSION file:', error.message);
    process.exit(1);
  }
}

findLatestNonBetaVersion();
