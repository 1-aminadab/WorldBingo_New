#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Source and destination paths
const SOURCE_DIR = path.join(__dirname, '../src/assets/audio/World Bingo App Audio');
const ANDROID_DEST = path.join(__dirname, '../android/app/src/main/res/raw');
const IOS_DEST = path.join(__dirname, '../ios/WorldBingo'); // Adjust this path as needed

// Voice folder mappings
const VOICE_MAPPINGS = {
  'english general': 'english_general',
  'spanish general': 'spanish_general',
  'amharic men Aradaw': 'amharic_men_aradaw',
  'amharic men Duryew': 'amharic_men_duryew',
  'amharic men Shebaw': 'amharic_men_shebaw',
  'amharic men Shebelaw': 'amharic_men_shebelaw',
  'amharic women amalaya': 'amharic_women_amalaya'
};

function copyAudioFiles() {
  console.log('Copying audio files from assets to bundle...');
  
  // Ensure destination directories exist
  if (!fs.existsSync(ANDROID_DEST)) {
    fs.mkdirSync(ANDROID_DEST, { recursive: true });
  }
  
  Object.keys(VOICE_MAPPINGS).forEach(sourceFolder => {
    const targetPrefix = VOICE_MAPPINGS[sourceFolder];
    const sourcePath = path.join(SOURCE_DIR, sourceFolder);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`Warning: Source folder not found: ${sourcePath}`);
      return;
    }
    
    console.log(`Processing: ${sourceFolder} -> ${targetPrefix}_*`);
    
    // Copy numbered files (1.mp3 to 75.mp3)
    for (let i = 1; i <= 75; i++) {
      const sourceFile = path.join(sourcePath, `${i}.mp3`);
      const targetFile = path.join(ANDROID_DEST, `${targetPrefix}_${i}.mp3`);
      
      if (fs.existsSync(sourceFile)) {
        try {
          fs.copyFileSync(sourceFile, targetFile);
          console.log(`  Copied: ${i}.mp3 -> ${targetPrefix}_${i}.mp3`);
        } catch (error) {
          console.error(`  Error copying ${i}.mp3:`, error.message);
        }
      } else {
        console.log(`  Missing: ${i}.mp3`);
      }
    }
    
    // Copy test files (try both test.mp3 and Test.mp3)
    const testFiles = ['test.mp3', 'Test.mp3'];
    let testCopied = false;
    
    for (const testFile of testFiles) {
      const sourceTestFile = path.join(sourcePath, testFile);
      if (fs.existsSync(sourceTestFile)) {
        const targetTestFile = path.join(ANDROID_DEST, `${targetPrefix}_test.mp3`);
        try {
          fs.copyFileSync(sourceTestFile, targetTestFile);
          console.log(`  Copied: ${testFile} -> ${targetPrefix}_test.mp3`);
          testCopied = true;
          break;
        } catch (error) {
          console.error(`  Error copying ${testFile}:`, error.message);
        }
      }
    }
    
    // Try test file in Other subfolder for English/Spanish
    if (!testCopied) {
      const otherTestFile = path.join(sourcePath, 'Other', 'test.mp3');
      if (fs.existsSync(otherTestFile)) {
        const targetTestFile = path.join(ANDROID_DEST, `${targetPrefix}_test.mp3`);
        try {
          fs.copyFileSync(otherTestFile, targetTestFile);
          console.log(`  Copied: Other/test.mp3 -> ${targetPrefix}_test.mp3`);
          testCopied = true;
        } catch (error) {
          console.error(`  Error copying Other/test.mp3:`, error.message);
        }
      }
    }
    
    if (!testCopied) {
      console.log(`  Warning: No test file found for ${sourceFolder}`);
    }
  });
  
  console.log('Audio file copying completed!');
  console.log(`Files copied to: ${ANDROID_DEST}`);
  console.log('\nNext steps:');
  console.log('1. Clean and rebuild your React Native project');
  console.log('2. Test the voice switching functionality');
}

// Run the script
if (require.main === module) {
  copyAudioFiles();
}

module.exports = { copyAudioFiles };