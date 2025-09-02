import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get domain from environment variable or CLI argument
const args = process.argv.slice(2);
const domainArg = args.find(arg => arg.startsWith('--domain='));
const DOMAIN_NAME = process.env.DOMAIN || 
                   (domainArg ? domainArg.split('=')[1] : 'ibd-nutrition');

// Set dynamic paths
const DOMAIN_PATH = path.join(__dirname, 'domain-files', DOMAIN_NAME);
const PLATFORM_PATH = path.join(__dirname, 'domain-files', 'platform-context');

console.log(`Building ${DOMAIN_NAME} context...`);
console.log('Domain Path:', DOMAIN_PATH);
console.log('Platform Path:', PLATFORM_PATH);

try {
  // Load domain configs
  const buildConfig = JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'build-config.json')));
  const knowledgeConfig = JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'knowledge-config.json')));
  const artifactsConfig = JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'artifacts-config.json')));
  const manifestConfig = JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'manifest-config.json')));

  // Project Context from build-config
  const PROJECT_CONTEXT = `**What are you working on?**
${buildConfig.project_context.working_on}

**What are you trying to achieve?**
${buildConfig.project_context.trying_to_achieve}`;

  // Context Establishment (always the same)
  const CONTEXT_INTRO = `## Setting Context
You're about to receive a Wayscribe domain - a complete consultation system. Like having expert materials in a project folder, these files work together to transform you into a consultation channel.

This isn't information to memorize or teach. It's expertise to embody.

The files are organized in layers:
- First, you'll understand the platform philosophy
- Then, quick orientation to this specific domain
- Next, the consultation settings and approach
- Finally, the core expertise and templates

Breathe it all in, then exhale consultations worth $50/month.`;

  // Build PROMPT_STRUCTURE dynamically
  const domainName = manifestConfig.display_name.replace(' powered by Wayscribe', '');
  const PROMPT_STRUCTURE = `Here's the complete consultation system:

**1. Platform Philosophy** (understand the Wayscribe platform's mission):
- \`platform-instructions.md\` - how to deliver consultations
- \`core_thesis_document.md\` - why expertise becomes living guidance
- \`landing-page.md\` - the company mission you're fulfilling
- \`wayscribe_product_benefits.md\` - recognizing consultation vs information
- \`architecture-notes.md\` - the jazz philosophy of expertise

**2. Domain Orientation** (quick understanding of the domain):
- \`getting-started.md\` - user entry points
- \`manifest-config.json\` - domain identification
- \`welcome-config.json\` - how to begin consultations

**3. Consultation Philosophy** (${domainName}'s approach):
- \`orchestration-config.json\` - consultation style settings
- \`knowledge-config.json\` - knowledge structure
- \`artifacts-config.json\` - available deliverables
- \`state-config.json\` - progress milestones that matter
- \`onboarding-config.json\` - user readiness philosophy
- \`synthesis-config.json\` - personalization priorities

**4. Core Expertise** (the knowledge to channel):
${knowledgeConfig.instructions.map(i => `- \`${i.file}\` - ${i.tag}`).join('\n')}
${knowledgeConfig.knowledge_files.map(k => `- \`${k.file}\` - ${k.tag}`).join('\n')}

**5. Templates** (deliverable structures):
${artifactsConfig.artifact_types.map(a => `- \`${a.file}\``).join('\n')}`;

  // Read platform files (always the same)
  const platformFiles = {
    'platform-instructions.md': fs.readFileSync(path.join(PLATFORM_PATH, 'platform-instructions.md'), 'utf-8'),
    'core_thesis_document.md': fs.readFileSync(path.join(PLATFORM_PATH, 'core_thesis_document.md'), 'utf-8'),
    'landing-page.md': fs.readFileSync(path.join(PLATFORM_PATH, 'landing-page.md'), 'utf-8'),
    'wayscribe_product_benefits.md': fs.readFileSync(path.join(PLATFORM_PATH, 'wayscribe_product_benefits.md'), 'utf-8'),
    'architecture-notes.md': fs.readFileSync(path.join(PLATFORM_PATH, 'architecture-notes.md'), 'utf-8')
  };

  // Read domain files dynamically
  const domainFiles = {};
  
  // Fixed domain meta files
  domainFiles['getting-started.md'] = fs.readFileSync(path.join(DOMAIN_PATH, 'getting-started.md'), 'utf-8');
  domainFiles['manifest-config.json'] = JSON.stringify(manifestConfig, null, 2);
  domainFiles['welcome-config.json'] = JSON.stringify(JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'welcome-config.json'))), null, 2);
  
  // Fixed config files
  domainFiles['orchestration-config.json'] = JSON.stringify(JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'orchestration-config.json'))), null, 2);
  domainFiles['knowledge-config.json'] = JSON.stringify(knowledgeConfig, null, 2);
  domainFiles['artifacts-config.json'] = JSON.stringify(artifactsConfig, null, 2);
  domainFiles['state-config.json'] = JSON.stringify(JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'state-config.json'))), null, 2);
  domainFiles['onboarding-config.json'] = JSON.stringify(JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'onboarding-config.json'))), null, 2);
  domainFiles['synthesis-config.json'] = JSON.stringify(JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'synthesis-config.json'))), null, 2);
  
  // Read instruction files (first in knowledge-config)
  knowledgeConfig.instructions.forEach(instruction => {
    domainFiles[instruction.file] = fs.readFileSync(path.join(DOMAIN_PATH, instruction.file), 'utf-8');
  });
  
  // Read knowledge files (in order from knowledge-config)
  knowledgeConfig.knowledge_files.forEach(knowledge => {
    if (knowledge.file.endsWith('.json')) {
      domainFiles[knowledge.file] = JSON.stringify(JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, knowledge.file))), null, 2);
    } else {
      domainFiles[knowledge.file] = fs.readFileSync(path.join(DOMAIN_PATH, knowledge.file), 'utf-8');
    }
  });
  
  // Read template files (in order from artifacts-config)
  artifactsConfig.artifact_types.forEach(artifact => {
    domainFiles[artifact.file] = fs.readFileSync(path.join(DOMAIN_PATH, artifact.file), 'utf-8');
  });

  // Build the complete context
  const DOMAIN_CONTEXT = `${PROJECT_CONTEXT}

${CONTEXT_INTRO}

${PROMPT_STRUCTURE}

## How to Guide Like a Pro

${buildConfig.how_to_guide}

## Now absorb the consultation system:
You're receiving compressed expertise - like jazz charts that guide improvisation rather than dictate every note. Each layer below serves a different function in your consultation capability. Process this as an integrated system for channeling expertise

### 1. Platform Philosophy

#### platform-instructions.md
${platformFiles['platform-instructions.md']}

#### core_thesis_document.md
${platformFiles['core_thesis_document.md']}

#### landing-page.md
${platformFiles['landing-page.md']}

#### wayscribe_product_benefits.md
${platformFiles['wayscribe_product_benefits.md']}

#### architecture-notes.md
${platformFiles['architecture-notes.md']}

By now you should have a foundation understanding of the Wayscribe platform philosophy. 

Please continue reading the domain orientation files to understand how this specific domain works.

### 2. Domain Orientation

#### getting-started.md
${domainFiles['getting-started.md']}

#### manifest-config.json
${domainFiles['manifest-config.json']}

#### welcome-config.json
${domainFiles['welcome-config.json']}

Continue reading the consultation philosophy files to understand the specific approach for ${domainName}.

### 3. Consultation Philosophy

#### orchestration-config.json
${domainFiles['orchestration-config.json']}

#### knowledge-config.json
${domainFiles['knowledge-config.json']}

#### artifacts-config.json
${domainFiles['artifacts-config.json']}

#### state-config.json
${domainFiles['state-config.json']}

#### onboarding-config.json
${domainFiles['onboarding-config.json']}

#### synthesis-config.json
${domainFiles['synthesis-config.json']}

Now please continue reading the core expertise files to understand the ${domainName} methodology itself.

### 4. Core Expertise

${knowledgeConfig.instructions.map(i => `#### ${i.file}\n${domainFiles[i.file]}`).join('\n\n')}

${knowledgeConfig.knowledge_files.map(k => `#### ${k.file}\n${domainFiles[k.file]}`).join('\n\n')}

Now look at the template files to understand the deliverables structure.

### 5. Templates

${artifactsConfig.artifact_types.map(a => `#### ${a.file}\n${domainFiles[a.file]}`).join('\n\n')}

## Beginning the Consultation

You've now absorbed the entire ${domainName} domain. 

The welcome-config.json defines your complete entry experience. Present it fully before engaging in consultation.

When creating deliverables, use the exact artifact names from artifacts-config.json as headers: ${artifactsConfig.artifact_types.map(a => `"${a.name}"`).join(', ')}.

${buildConfig.remember}

Please begin with the welcome as configured, then await the user's situation.`;

  // Create config object for frontend use
  const DOMAIN_CONFIG = {
    manifest: manifestConfig,
    welcome: JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'welcome-config.json'))),
    artifacts: artifactsConfig,
    orchestration: JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'orchestration-config.json'))),
    synthesis: JSON.parse(fs.readFileSync(path.join(DOMAIN_PATH, 'synthesis-config.json')))
  };

  // Write the bundled context and config
  fs.writeFileSync(
    path.join(__dirname, 'domain-context.js'), 
    `export const DOMAIN_CONTEXT = ${JSON.stringify(DOMAIN_CONTEXT)};

export const DOMAIN_CONFIG = ${JSON.stringify(DOMAIN_CONFIG, null, 2)};`
  );

  // Calculate size
  const sizeKB = Math.round(Buffer.byteLength(DOMAIN_CONTEXT, 'utf8') / 1024);
  console.log(`✅ ${manifestConfig.display_name} context bundled successfully! Size: ${sizeKB}KB`);
  console.log(`📁 Output: ${path.join(__dirname, 'domain-context.js')}`);

} catch (error) {
  console.error('❌ Error building context:', error.message);
  process.exit(1);
}