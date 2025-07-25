import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to local domain files
const IBD_PATH = path.join(__dirname, 'domain-files', 'ibd-nutrition');
const PLATFORM_PATH = path.join(__dirname, 'domain-files', 'platform-context');

console.log('Building IBD Nutrition Navigator context...');
console.log('IBD Path:', IBD_PATH);
console.log('Platform Path:', PLATFORM_PATH);

try {
  // Read files in exact order from the implementation plan
  const sections = [
    '// PLATFORM PHILOSOPHY',
    fs.readFileSync(path.join(PLATFORM_PATH, 'platform-instructions.md'), 'utf-8'),
    fs.readFileSync(path.join(PLATFORM_PATH, 'core_thesis_document.md'), 'utf-8'),
    fs.readFileSync(path.join(PLATFORM_PATH, 'landing-page.md'), 'utf-8'),
    fs.readFileSync(path.join(PLATFORM_PATH, 'wayscribe_product_benefits.md'), 'utf-8'),
    fs.readFileSync(path.join(PLATFORM_PATH, 'architecture-notes.md'), 'utf-8'),
    
    '// DOMAIN ORIENTATION',
    fs.readFileSync(path.join(IBD_PATH, 'getting-started.md'), 'utf-8'),
    JSON.stringify(JSON.parse(fs.readFileSync(path.join(IBD_PATH, 'manifest-config.json'))), null, 2),
    JSON.stringify(JSON.parse(fs.readFileSync(path.join(IBD_PATH, 'welcome-config.json'))), null, 2),
    
    '// CONSULTATION PHILOSOPHY',
    JSON.stringify(JSON.parse(fs.readFileSync(path.join(IBD_PATH, 'orchestration-config.json'))), null, 2),
    JSON.stringify(JSON.parse(fs.readFileSync(path.join(IBD_PATH, 'knowledge-config.json'))), null, 2),
    JSON.stringify(JSON.parse(fs.readFileSync(path.join(IBD_PATH, 'artifacts-config.json'))), null, 2),
    JSON.stringify(JSON.parse(fs.readFileSync(path.join(IBD_PATH, 'state-config.json'))), null, 2),
    JSON.stringify(JSON.parse(fs.readFileSync(path.join(IBD_PATH, 'onboarding-config.json'))), null, 2),
    JSON.stringify(JSON.parse(fs.readFileSync(path.join(IBD_PATH, 'synthesis-config.json'))), null, 2),
    
    '// CORE EXPERTISE',
    fs.readFileSync(path.join(IBD_PATH, 'ibd-nutrition-system-instructions.md'), 'utf-8'),
    fs.readFileSync(path.join(IBD_PATH, 'ibd-nutrition-navigator.md'), 'utf-8'),
    
    '// TEMPLATES',
    fs.readFileSync(path.join(IBD_PATH, 'personalized-nutrition-plan.md'), 'utf-8'),
    fs.readFileSync(path.join(IBD_PATH, 'weekly-meal-plan.md'), 'utf-8'),
    fs.readFileSync(path.join(IBD_PATH, 'progress-summary.md'), 'utf-8'),
    fs.readFileSync(path.join(IBD_PATH, 'educational-materials.md'), 'utf-8')
  ];

  const DOMAIN_CONTEXT = `You are facilitating a Wayscribe consultation for IBD Nutrition Navigator.

${sections.join('\n\n')}

You're applying the IBD Nutrition Navigator™ framework to deliver $50/month-worthy guidance. After absorbing all files, provide the welcome experience as specified in welcome-config.json, then await my IBD situation.

Let's use this as a guiding principle for this thread: "The ideal outcome for a patient spending 20 minutes in this consultation is that they take back a basic understanding that there is a nutritional option that will work for them in their current condition/situation. In addition, it will give them next steps to their health care provider to follow up with."

Be certain to use today's date when consulting.`;

  // Write the bundled context
  fs.writeFileSync(
    path.join(__dirname, 'domain-context.js'), 
    `export const DOMAIN_CONTEXT = ${JSON.stringify(DOMAIN_CONTEXT)};`
  );

  // Calculate size
  const sizeKB = Math.round(Buffer.byteLength(DOMAIN_CONTEXT, 'utf8') / 1024);
  console.log(`✅ Context bundled successfully! Size: ${sizeKB}KB`);
  console.log(`📁 Output: ${path.join(__dirname, 'domain-context.js')}`);

} catch (error) {
  console.error('❌ Error building context:', error.message);
  process.exit(1);
}
