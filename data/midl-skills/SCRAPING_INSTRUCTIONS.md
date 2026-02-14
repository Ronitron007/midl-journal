# MIDL Skills Scraping Instructions

## Progress Status

| Skill | Name                   | Status |
| ----- | ---------------------- | ------ |
| 00    | Diaphragm Breathing    | Done   |
| 01    | Body Relaxation        | Done   |
| 02    | Mind Relaxation        | Done   |
| 03    | Mindful Presence       | Done   |
| 04    | Content Presence       | Done   |
| 05    | Natural Breathing      | Done   |
| 06    | Whole of Each Breath   | Done   |
| 07    | Breath Sensations      | Done   |
| 08    | One Point of Sensation | Done   |
| 09    | Sustained Attention    | Done   |
| 10    | Whole-Body Breathing   | Done   |
| 11    | Sustained Awareness    | Done   |
| 12    | Access Concentration   | Done   |
| 13    | First Pleasure Jhana   | Done   |
| 14    | Second Pleasure Jhana  | Done   |
| 15    | Third Pleasure Jhana   | Done   |
| 16    | Fourth Pleasure Jhana  | Done   |

## Scraping Method

### Prerequisites

- Playwright browser automation
- Login credentials for midlmeditation.com

### Login URL

```
https://midlmeditation.com/m/login?r=%2Fm%2Faccount
```

### Skill URLs

```
https://midlmeditation.com/meditation-skill-{NUMBER}
```

Where NUMBER is 00-16 (zero-padded for 00-09).

### Scraping Steps

1. **Navigate to skill page**
2. **Dismiss popups** - Press Escape to dismiss cookie/retreat modals
3. **Expand all accordions** - Click buttons with `aria-expanded="false"`
4. **Extract content** - Use `page.evaluate()` to get full text

### Playwright Code Pattern

```javascript
async (page) => {
  // Click all accordion buttons to expand
  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    try {
      const expanded = await btn.getAttribute('aria-expanded');
      if (expanded === 'false') {
        await btn.click();
        await page.waitForTimeout(300);
      }
    } catch (e) {}
  }
  await page.waitForTimeout(500);

  // Extract content
  const content = await page.evaluate(() => {
    const sections = document.querySelectorAll('[data-ux="Section"]');
    let text = '';
    sections.forEach((s) => {
      text += s.innerText + '\n\n';
    });
    return text || document.body.innerText;
  });
  return content;
};
```

## Content Structure

Each skill page contains:

- **Title**: Meditation Skill {NUMBER}
- **Cultivation**: Which cultivation category (01-06)
- **Name**: Skill name (e.g., "Body Relaxation")
- **Subtitle**: Brief description
- **Quote**: Buddhist sutta reference
- **Overview**: Summary of the skill
- **Duration**: Recommended meditation length
- **Benefits**: What the skill teaches
- **Purpose**: Goal of the practice
- **Resources**: YouTube and SoundCloud links
- **Step-by-Step Instructions**: Detailed meditation instructions
- **Insight Section**: Including:
  - Progression Map for Mindfulness of Breathing
  - Meditative Hindrance description
  - Antidote
- **Daily Application**: How to use in daily life
- **Progression Criteria**: When ready for next skill
- **Support Teachings**: (optional) Additional theory

## Output Format

Save as `skill_{NUMBER}_raw.txt` with content formatted as plain text, preserving section headers and structure.

## Remaining Tasks

None - all tasks complete.

## Completed

- All 17 skills (00-16) scraped and saved to `skill_XX_raw.txt` files
- `midl_skills_complete.json` updated with detailed content from all raw files

## Files

- `skill_XX_raw.txt` - Raw text content for each skill
- `midl_skills_complete.json` - Structured JSON with all skills metadata
- `html_raw/` - Original HTML captures
- `screenshots/` - Page screenshots
