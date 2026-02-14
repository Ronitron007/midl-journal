/**
 * Generate shared/skills.json and shared/cultivations.json from markdown sources
 *
 * Usage: npx ts-node scripts/generate-shared-data.ts
 *    or: node --experimental-strip-types scripts/generate-shared-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data/midl-skills');
const SHARED_DIR = path.join(__dirname, '../shared');
const AI_DATA_DIR = path.join(__dirname, '../app/supabase/functions/ai/data');

// Types
interface Skill {
  id: string;
  name: string;
  cultivation_id: string;
  subtitle: string;
  duration: string;
  quote?: { text: string; attribution: string };
  overview: string;
  benefits: string[];
  purpose: string;
  resources: {
    youtube?: string;
    soundcloud?: string;
    pdf?: string;
    other?: string[];
  };
  instructions: {
    intro?: string;
    steps: { step: number; title: string; content: string }[];
  };
  tips?: string[];
  obstacles?: { title: string; content: string }[];
  insight: {
    marker: string;
    hindrance: string;
    antidote?: string;
  };
  daily_application?: {
    check_in?: string;
    learnings?: string[];
    steps?: string[];
  };
  progression: {
    criteria: string;
    next_skill?: string;
    previous_skill?: string;
  };
}

interface Cultivation {
  id: string;
  name: string;
  suitability: string;
  membership_required: boolean;
  purpose: string;
  what_you_will_learn: string[];
  skill_ids: string[];
  support_articles?: { name: string; url: string }[];
}

// Cultivation mapping
const CULTIVATION_MAP: Record<
  string,
  { name: string; suitability: string; membership: boolean }
> = {
  '01': {
    name: 'Mindfulness of Body',
    suitability: 'Everyone',
    membership: false,
  },
  '02': {
    name: 'Mindfulness of Breathing',
    suitability: 'Intermediate meditator',
    membership: true,
  },
  '03': {
    name: 'Calm & Tranquillity',
    suitability: 'Skilled meditator',
    membership: true,
  },
  '04': {
    name: 'Joyfulness & Unification',
    suitability: 'Accomplished meditator',
    membership: true,
  },
  '05': {
    name: 'Pleasure Jhana & Equanimity',
    suitability: 'Proficient meditator',
    membership: true,
  },
};

// Skill to cultivation mapping
const SKILL_CULTIVATION: Record<string, string> = {
  '00': '01',
  '01': '01',
  '02': '01',
  '03': '01',
  '04': '02',
  '05': '02',
  '06': '02',
  '07': '03',
  '08': '03',
  '09': '03',
  '10': '04',
  '11': '04',
  '12': '04',
  '13': '05',
  '14': '05',
  '15': '05',
  '16': '05',
};

function parseSkillFile(content: string, skillId: string): Skill {
  const lines = content.split('\n');

  // Extract header info
  const headerMatch = lines[0].match(/^# Skill (\d+): (.+)$/);
  const name = headerMatch ? headerMatch[2].trim() : '';

  // Extract metadata
  const cultivationLine = lines.find((l) => l.startsWith('Cultivation:')) || '';
  const cultivationMatch = cultivationLine.match(/Cultivation:\s*(\d+)/);
  const cultivation_id = cultivationMatch
    ? cultivationMatch[1]
    : SKILL_CULTIVATION[skillId];

  const subtitleLine = lines.find((l) => l.startsWith('Subtitle:')) || '';
  const subtitle = subtitleLine.replace('Subtitle:', '').trim();

  const durationLine = lines.find((l) => l.startsWith('Duration:')) || '';
  const duration = durationLine.replace('Duration:', '').trim();

  // Parse sections
  const sections = parseSections(content);

  // Extract quote if exists
  let quote: { text: string; attribution: string } | undefined;
  const quoteMatch = content.match(/^>\s*(.+?)\s*—\s*(.+)$/m);
  if (quoteMatch) {
    quote = { text: quoteMatch[1].trim(), attribution: quoteMatch[2].trim() };
  }

  // Extract resources
  const resources: Skill['resources'] = {};
  const resourceSection = sections['Resources'] || '';
  const youtubeMatch = resourceSection.match(/YouTube:\s*(https?:\/\/[^\s]+)/);
  const soundcloudMatch = resourceSection.match(
    /SoundCloud:\s*(https?:\/\/[^\s]+)/
  );
  if (youtubeMatch) resources.youtube = youtubeMatch[1];
  if (soundcloudMatch) resources.soundcloud = soundcloudMatch[1];

  // Extract instructions
  const instructionSection = sections['Instructions'] || '';
  const stepMatches = [
    ...instructionSection.matchAll(
      /### Step (\d+):\s*(.+?)\n\n([\s\S]*?)(?=### Step|\n## |$)/g
    ),
  ];
  const introMatch = instructionSection.match(/^([\s\S]*?)(?=### Step)/);

  const instructions: Skill['instructions'] = {
    intro: introMatch ? introMatch[1].trim() : undefined,
    steps: stepMatches.map((m) => ({
      step: parseInt(m[1]),
      title: m[2].trim(),
      content: m[3].trim(),
    })),
  };

  // Extract tips
  const tipsSection = sections['Tips'] || '';
  const tips = tipsSection
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => l.replace(/^- /, '').trim());

  // Extract obstacles
  const obstaclesSection = sections['Obstacles'] || '';
  const obstacleMatches = [
    ...obstaclesSection.matchAll(/### (.+?)\n\n([\s\S]*?)(?=### |$)/g),
  ];
  const obstacles = obstacleMatches.map((m) => ({
    title: m[1].trim(),
    content: m[2].trim(),
  }));

  // Extract insight
  const insightSection = sections['Insight'] || '';
  const markerMatch = insightSection.match(/Marker:\s*(.+)/);
  const hindranceMatch = insightSection.match(/Hindrance:\s*(.+)/);
  const antidoteMatch = insightSection.match(
    /Antidote:\s*([\s\S]*?)(?=\n\n|\n-|$)/
  );

  const insight: Skill['insight'] = {
    marker: markerMatch ? markerMatch[1].trim() : '',
    hindrance: hindranceMatch ? hindranceMatch[1].trim() : '',
    antidote: antidoteMatch ? antidoteMatch[1].trim() : undefined,
  };

  // Extract daily application
  const dailySection = sections['Daily Application'] || '';
  const checkInMatch = dailySection.match(/Check-in:\s*"?(.+?)"?\n/);
  const learningsMatch = dailySection.match(
    /### Learnings\n([\s\S]*?)(?=###|$)/
  );

  const daily_application: Skill['daily_application'] = {
    check_in: checkInMatch ? checkInMatch[1].trim() : undefined,
    learnings: learningsMatch
      ? learningsMatch[1]
          .split('\n')
          .filter((l) => l.startsWith('- '))
          .map((l) => l.replace(/^- /, '').trim())
      : undefined,
  };

  // Extract progression
  const progressionSection = sections['Progression'] || '';
  const criteriaMatch = progressionSection.match(
    /Criteria:\s*([\s\S]*?)(?=\nNext:|$)/
  );
  const nextMatch = progressionSection.match(/Next:\s*(.+)/);
  const prevMatch = progressionSection.match(/Previous:\s*(.+)/);

  const progression: Skill['progression'] = {
    criteria: criteriaMatch ? criteriaMatch[1].trim() : '',
    next_skill: nextMatch ? nextMatch[1].trim() : undefined,
    previous_skill: prevMatch ? prevMatch[1].trim() : undefined,
  };

  // Extract benefits and purpose
  const benefitsSection = sections['Benefits'] || '';
  const benefits = benefitsSection
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => l.replace(/^- /, '').trim());

  const purpose = (sections['Purpose'] || '').trim();
  const overview = (sections['Overview'] || '').trim();

  return {
    id: skillId,
    name,
    cultivation_id,
    subtitle,
    duration,
    quote,
    overview,
    benefits,
    purpose,
    resources,
    instructions,
    tips: tips.length > 0 ? tips : undefined,
    obstacles: obstacles.length > 0 ? obstacles : undefined,
    insight,
    daily_application:
      daily_application.check_in || daily_application.learnings
        ? daily_application
        : undefined,
    progression,
  };
}

function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionMatches = [
    ...content.matchAll(/^## (.+?)\n\n([\s\S]*?)(?=\n## |$)/gm),
  ];

  for (const match of sectionMatches) {
    sections[match[1].trim()] = match[2].trim();
  }

  return sections;
}

function main() {
  // Ensure shared directory exists
  if (!fs.existsSync(SHARED_DIR)) {
    fs.mkdirSync(SHARED_DIR, { recursive: true });
  }

  // Parse all skill files
  const skills: Record<string, Skill> = {};

  for (let i = 0; i <= 16; i++) {
    const skillId = i.toString().padStart(2, '0');
    const filePath = path.join(DATA_DIR, `skill_${skillId}.md`);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      skills[skillId] = parseSkillFile(content, skillId);
      console.log(`Parsed skill ${skillId}: ${skills[skillId].name}`);
    } else {
      console.warn(`Missing: ${filePath}`);
    }
  }

  // Build cultivations from skills
  const cultivations: Record<string, Cultivation> = {};

  for (const [id, info] of Object.entries(CULTIVATION_MAP)) {
    const skillIds = Object.entries(SKILL_CULTIVATION)
      .filter(([_, cId]) => cId === id)
      .map(([sId]) => sId);

    cultivations[id] = {
      id,
      name: info.name,
      suitability: info.suitability,
      membership_required: info.membership,
      purpose: '', // Would need cultivation files to fill this
      what_you_will_learn: [],
      skill_ids: skillIds,
    };
  }

  // Ensure AI data directory exists
  if (!fs.existsSync(AI_DATA_DIR)) {
    fs.mkdirSync(AI_DATA_DIR, { recursive: true });
  }

  // Write output files to shared/
  fs.writeFileSync(
    path.join(SHARED_DIR, 'skills.json'),
    JSON.stringify(skills, null, 2)
  );
  console.log(
    `\nWrote shared/skills.json (${Object.keys(skills).length} skills)`
  );

  fs.writeFileSync(
    path.join(SHARED_DIR, 'cultivations.json'),
    JSON.stringify(cultivations, null, 2)
  );
  console.log(
    `Wrote shared/cultivations.json (${Object.keys(cultivations).length} cultivations)`
  );

  // Write output files to supabase/functions/ai/data/
  fs.writeFileSync(
    path.join(AI_DATA_DIR, 'skills.json'),
    JSON.stringify(skills, null, 2)
  );
  console.log(`Wrote app/supabase/functions/ai/data/skills.json`);

  fs.writeFileSync(
    path.join(AI_DATA_DIR, 'cultivations.json'),
    JSON.stringify(cultivations, null, 2)
  );
  console.log(`Wrote app/supabase/functions/ai/data/cultivations.json`);

  // Copy types.ts to AI data directory
  const typesSource = path.join(SHARED_DIR, 'types.ts');
  const typesDest = path.join(AI_DATA_DIR, 'types.ts');
  if (fs.existsSync(typesSource)) {
    fs.copyFileSync(typesSource, typesDest);
    console.log(
      `Copied shared/types.ts to app/supabase/functions/ai/data/types.ts`
    );
  }

  // Generate TypeScript file with embedded markdown content (for edge function bundling)
  const markdownEntries: string[] = [];

  for (let i = 0; i <= 16; i++) {
    const skillId = i.toString().padStart(2, '0');
    const srcPath = path.join(DATA_DIR, `skill_${skillId}.md`);

    if (fs.existsSync(srcPath)) {
      const content = fs.readFileSync(srcPath, 'utf-8');
      // Escape backticks and ${} for template literal
      const escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
      markdownEntries.push(`  "${skillId}": \`${escaped}\``);
    }
  }

  const markdownTs = `/**
 * Auto-generated skill markdown content
 * Source: data/midl-skills/skill_*.md
 * Generated by: scripts/generate-shared-data.ts
 *
 * DO NOT EDIT - regenerate with: npm run generate
 */

export const SKILLS_MARKDOWN: Record<string, string> = {
${markdownEntries.join(',\n')}
};

export function getSkillMarkdown(skillId: string): string | null {
  return SKILLS_MARKDOWN[skillId] ?? null;
}
`;

  fs.writeFileSync(path.join(AI_DATA_DIR, 'skill-markdown.ts'), markdownTs);
  console.log(
    `Generated app/supabase/functions/ai/data/skill-markdown.ts (${markdownEntries.length} skills)`
  );
}

main();
