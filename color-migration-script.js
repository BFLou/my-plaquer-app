// color-migration-script.js
// Run this in your project root: node color-migration-script.js

const fs = require('fs');
const path = require('path');

// File-specific color mappings
const fileColorMap = {
  'Collections.tsx': 'collections',
  'CollectionDetail.tsx': 'collections', 
  'CollectionDetailPage.tsx': 'collections',
  'Routes.tsx': 'routes',
  'RouteDetail.tsx': 'routes',
  'RoutesManagementPage.tsx': 'routes',
  'Discover.tsx': 'discover',
  'VisitsPage.tsx': 'discover', // Visits use discover colors
  'LibraryPage.tsx': 'library',
  'ProfilePage.tsx': 'profile',
  'SettingsPage.tsx': 'profile',
  'About.tsx': 'profile'
};

// Color replacements
const colorReplacements = [
  // Header gradients
  {
    find: /bg-gradient-to-br from-(purple|green|blue|indigo|slate|amber)-600 to-(purple|green|blue|indigo|slate|amber)-700/g,
    replace: (match, color1, color2, filename) => {
      const area = getAreaFromFilename(filename);
      return `\${getHeaderGradient('${area}')}`;
    }
  },
  
  // Primary buttons
  {
    find: /bg-(purple|green|blue|indigo|slate|amber)-600 hover:bg-(purple|green|blue|indigo|slate|amber)-700/g,
    replace: (match, color1, color2, filename) => {
      const area = getAreaFromFilename(filename);
      return `\${getButtonColors('${area}').primary}`;
    }
  },
  
  // Badge backgrounds
  {
    find: /bg-(purple|green|blue|indigo|slate|amber)-100 text-(purple|green|blue|indigo|slate|amber)-(600|700) border-(purple|green|blue|indigo|slate|amber)-200/g,
    replace: (match, bg, text, textShade, border, filename) => {
      const area = getAreaFromFilename(filename);
      return `\${getBadgeColors('${area}')} border`;
    }
  },
  
  // Text colors
  {
    find: /text-(purple|green|blue|indigo|slate|amber)-600/g,
    replace: (match, color, filename) => {
      const area = getAreaFromFilename(filename);
      return `\${getColorClasses('${area}').text}`;
    }
  },
  
  // Favorite colors (special case)
  {
    find: /text-amber-500|fill-amber-500/g,
    replace: () => `\${APP_COLORS.favorites.text}`
  }
];

function getAreaFromFilename(filename) {
  const baseName = path.basename(filename);
  return fileColorMap[baseName] || 'neutral';
}

function addImports(content, filename) {
  const area = getAreaFromFilename(filename);
  const hasGetHeaderGradient = content.includes('getHeaderGradient');
  const hasGetButtonColors = content.includes('getButtonColors');
  const hasGetBadgeColors = content.includes('getBadgeColors');
  const hasGetColorClasses = content.includes('getColorClasses');
  const hasAPP_COLORS = content.includes('APP_COLORS');
  
  let imports = [];
  if (hasGetHeaderGradient) imports.push('getHeaderGradient');
  if (hasGetButtonColors) imports.push('getButtonColors');
  if (hasGetBadgeColors) imports.push('getBadgeColors');
  if (hasGetColorClasses) imports.push('getColorClasses');
  if (hasAPP_COLORS) imports.push('APP_COLORS');
  
  if (imports.length > 0) {
    const importStatement = `import { ${imports.join(', ')} } from '@/config/colors';\n`;
    
    // Add after existing imports
    const importRegex = /(import.*from.*;\n)+/;
    if (importRegex.test(content)) {
      return content.replace(importRegex, (match) => match + importStatement);
    } else {
      return importStatement + content;
    }
  }
  
  return content;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // Apply color replacements
  colorReplacements.forEach(({ find, replace }) => {
    newContent = newContent.replace(find, (match, ...args) => {
      if (typeof replace === 'function') {
        return replace(match, ...args, filePath);
      }
      return replace;
    });
  });
  
  // Add necessary imports
  newContent = addImports(newContent, filePath);
  
  // Only write if content changed
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      updatedCount += walkDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (processFile(filePath)) {
        updatedCount++;
      }
    }
  });
  
  return updatedCount;
}

// Main execution
console.log('🎨 Starting color migration...\n');

const srcPath = path.join(__dirname, 'src');
if (!fs.existsSync(srcPath)) {
  console.error('❌ src directory not found. Run this script from your project root.');
  process.exit(1);
}

const updatedFiles = walkDirectory(srcPath);

console.log(`\n🎉 Migration complete! Updated ${updatedFiles} files.`);
console.log('\n📋 Next steps:');
console.log('1. Create src/config/colors.ts with the color configuration');
console.log('2. Review the changes and test your app');
console.log('3. Manually adjust any area assignments that seem incorrect');
console.log('4. Update any remaining edge cases');

// Generate a summary of file mappings
console.log('\n📁 File to area mappings:');
Object.entries(fileColorMap).forEach(([file, area]) => {
  console.log(`   ${file} → ${area}`);
});