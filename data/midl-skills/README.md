# MIDL Insight Meditation Skills

Scraped from https://midlmeditation.com on 2026-01-19

## Overview

The MIDL (Mindfulness in Daily Life) Insight Meditation System consists of **6 Cultivations** containing **17 numbered skills** (00-16) plus 2 advanced topics.

## Structure

```
midl-skills/
├── README.md                          # This file
├── midl_skills_complete.json          # Complete structured data
├── skills_structure.json              # Skill hierarchy and metadata
├── skill_00.json                      # Detailed Skill 00 data
├── skill_01_raw.txt                   # Detailed Skill 01 content
├── skill_02_raw.txt                   # Detailed Skill 02 content
└── cultivations/
    ├── cultivation-01-mindfulness-of-body.md
    ├── cultivation-02-mindfulness-of-breathing.md
    ├── cultivation-03-calm-and-tranquillity.md
    ├── cultivation-04-joyfulness-and-unification.md
    ├── cultivation-05-pleasure-jhana-and-equanimity.md
    └── cultivation-06-advanced-insight-and-application.md
```

## Quick Reference

### Cultivations

| # | Name | Suitability | Skills |
|---|------|-------------|--------|
| 01 | Mindfulness of Body | Everyone | 00-03 |
| 02 | Mindfulness of Breathing | Intermediate | 04-06 |
| 03 | Calm & Tranquillity | Skilled | 07-09 |
| 04 | Joyfulness & Unification | Accomplished | 10-12 |
| 05 | Pleasure Jhana & Equanimity | Proficient | 13-16 |
| 06 | Advanced Insight | Advanced | Stream Entry topics |

### Progression Map

Each skill addresses a specific **Hindrance** and develops a corresponding **Marker** of progress:

| Skill | Marker | Hindrance |
|-------|--------|-----------|
| 00 | Diaphragm Breathing | Stress Breathing |
| 01 | Body Relaxation | Physical Restlessness |
| 02 | Mind Relaxation | Mental Restlessness |
| 03 | Mindful Presence | Sleepiness & Dullness |
| 04 | Content Presence | Habitual Forgetting |
| 05 | Natural Breathing | Habitual Control |
| 06 | Whole of Each Breath | Mind Wandering |
| 07 | Breath Sensations | Gross Dullness |
| 08 | One Point of Sensation | Subtle Dullness |
| 09 | Sustained Attention | Subtle Wandering |
| 10 | Whole-Body Breathing | Sensory Stimulation |
| 11 | Sustained Awareness | Anticipation of Pleasure |
| 12 | Access Concentration | Fear of Letting Go |

## Skills with Detailed Content

The following skills have full content including instructions, obstacles, insights, and daily applications:

- **Skill 00:** Diaphragmatic Breathing (full JSON + raw text)
- **Skill 01:** Body Relaxation (raw text)
- **Skill 02:** Mind Relaxation (raw text)

Skills 03-16 have metadata and structure but require additional scraping for full content.

## Key Concepts

### GOSS Formula
The GOSS Formula is used throughout for letting go of distraction:
- **G** - Ground yourself in body
- **O** - Observe what's happening
- **S** - Soften/relax around it
- **S** - Stay with the experience

### Softening Breaths
Slow, relaxing breaths that help body and mind become softer. Key technique throughout all skills.

## Resources

- Main Course: https://midlmeditation.com/midl-meditation-system
- Meditation Markers: https://midlmeditation.com/meditation-markers
- Meditative Hindrances: https://midlmeditation.com/meditative-hindrances
- GOSS Formula: https://midlmeditation.com/goss-how-to-let-go

## Usage for Progress Tracking App

The `midl_skills_complete.json` file provides structured data suitable for building a progress tracking application:

- Each skill has a unique ID (00-16)
- Skills are organized hierarchically by cultivation
- Progression is sequential (complete each skill before moving to next)
- Each skill has associated marker and hindrance for tracking
- `has_detailed_content` flag indicates which skills have full instructions

## Author

MIDL Insight Meditation by Stephen Procter
