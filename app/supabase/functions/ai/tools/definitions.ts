import type { ChatCompletionTool } from "npm:openai@4/resources/chat/completions";

/**
 * Tool definitions for chat completions
 * These allow the AI to fetch context about the user and their practice
 */
export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description:
        "Get the user's meditation profile including their current skill level, practice stats, and any onboarding preferences they shared",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_skill_details",
      description:
        "Get detailed information about a specific MIDL skill including the marker to develop, hindrance to work with, and key techniques",
      parameters: {
        type: "object",
        properties: {
          skill_id: {
            type: "string",
            description: "The skill ID (00-16), e.g. '00' for Diaphragmatic Breathing",
          },
        },
        required: ["skill_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_entries",
      description:
        "Get the user's recent journal entries with extracted signals like mood, hindrances, and breakthroughs. Use this to understand their recent practice patterns.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of entries to fetch (default 5, max 10)",
          },
          skill_filter: {
            type: "string",
            description: "Optional skill ID to filter entries by (e.g. '00')",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_progression_stats",
      description:
        "Get the user's progression stats for their current skill, including how close they are to advancing to the next skill",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_hindrance_patterns",
      description:
        "Analyze the user's recent hindrance patterns to understand recurring struggles and what conditions trigger them",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of recent entries to analyze (default 10)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_practice_summary",
      description:
        "Get rolling summaries of the user's meditation practice over time. Use this for questions about patterns, progress, or historical context.",
      parameters: {
        type: "object",
        properties: {
          timeframe: {
            type: "string",
            enum: ["this_week", "this_month", "recent"],
            description:
              "Timeframe for summary: this_week (current week), this_month (current month), recent (last 4 weeks)",
          },
        },
        required: [],
      },
    },
  },
];
