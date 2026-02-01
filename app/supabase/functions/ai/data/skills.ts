// Minimal skill data for entry processing prompts
// Extracted from midl_skills_complete.json

export type SkillData = {
  id: string;
  name: string;
  marker: string;
  hindrance: string;
  techniques: string[];
  progressionCriteria: string;
};

export const SKILLS_DATA: Record<string, SkillData> = {
  "00": {
    id: "00",
    name: "Diaphragmatic Breathing",
    marker: "Diaphragm Breathing - natural belly breathing during meditation",
    hindrance: "Stress Breathing - short, shallow breaths in the chest",
    techniques: [
      "belly breathing",
      "diaphragmatic breathing",
      "slow abdominal breaths",
      "breathing from abdomen to chest",
      "allowing natural breathing"
    ],
    progressionCriteria: "Feeling of relaxation after slow belly breaths, diaphragmatic breathing happens naturally during meditation"
  },
  "01": {
    id: "01",
    name: "Body Relaxation",
    marker: "Body Relaxation - feeling comfortable and at ease in the body",
    hindrance: "Physical Restlessness - urge to move, fidget, or change position",
    techniques: [
      "relaxing body with slow breaths",
      "softening tension",
      "body scan relaxation",
      "releasing physical tension"
    ],
    progressionCriteria: "Body feels comfortable and settled, no strong urge to move or adjust position"
  },
  "02": {
    id: "02",
    name: "Mind Relaxation",
    marker: "Mind Relaxation - thoughts settle, mental chatter reduces",
    hindrance: "Mental Restlessness - busy mind, intrusive thoughts, mental agitation",
    techniques: [
      "relaxing mind with out-breaths",
      "relaxing eyelids",
      "softening interest in thoughts",
      "creating space around thoughts"
    ],
    progressionCriteria: "Mind feels calmer, less caught up in thoughts, able to let thoughts pass"
  },
  "03": {
    id: "03",
    name: "Mindful Presence",
    marker: "Mindful Presence - clear awareness of body in present moment",
    hindrance: "Sleepiness & Dullness - drowsiness, foggy mind, loss of clarity",
    techniques: [
      "GOSS formula (Ground, Observe, Soften, Smile)",
      "staying present in body",
      "mindful nonparticipation",
      "softening breaths"
    ],
    progressionCriteria: "Able to stay present without drifting into sleepiness, clear awareness maintained"
  },
  "04": {
    id: "04",
    name: "Content Presence",
    marker: "Content Presence - feeling of contentment and ease with simple presence",
    hindrance: "Habitual Forgetting - repeatedly forgetting to be mindful, losing awareness",
    techniques: [
      "enjoying contentment",
      "smiling with eyes",
      "finding pleasure in letting go",
      "GOSS formula"
    ],
    progressionCriteria: "Able to return to presence quickly when distracted, periods of sustained contentment"
  },
  "05": {
    id: "05",
    name: "Natural Breathing",
    marker: "Natural Breathing - breathing flows on its own without control",
    hindrance: "Habitual Control - tendency to control or manipulate the breath",
    techniques: [
      "letting breathing happen naturally",
      "releasing control of breath",
      "enjoying natural flow of breath",
      "observing without interfering"
    ],
    progressionCriteria: "Breath flows naturally without interference, able to observe without controlling"
  },
  "06": {
    id: "06",
    name: "Whole of Each Breath",
    marker: "Whole of Each Breath - clear awareness of complete in-breath and out-breath",
    hindrance: "Mind Wandering - attention drifts away during breath observation",
    techniques: [
      "following whole length of breath",
      "clear comprehension of in-breath",
      "clear comprehension of out-breath",
      "sustained breath awareness"
    ],
    progressionCriteria: "Can follow multiple breaths without losing awareness, reduced mind wandering"
  },
  "07": {
    id: "07",
    name: "Breath Sensations",
    marker: "Breath Sensations - clear awareness of physical sensations of breathing",
    hindrance: "Gross Dullness - mind becomes dull, loses sharpness and clarity",
    techniques: [
      "tuning into elemental quality of breath",
      "feeling breath sensations",
      "calming body, breathing, mind",
      "enhancing enjoyment of calm"
    ],
    progressionCriteria: "Clear perception of breath sensations, mind stays alert and clear"
  },
  "08": {
    id: "08",
    name: "One Point of Sensation",
    marker: "One Point of Sensation - sustained focus on single point of breath sensation",
    hindrance: "Subtle Dullness - subtle loss of clarity, mind slightly foggy",
    techniques: [
      "one-point breath sensation",
      "increasing tranquility",
      "relaxing perception of time",
      "sharpening clarity"
    ],
    progressionCriteria: "Sustained clear focus on one point, tranquility deepens"
  },
  "09": {
    id: "09",
    name: "Sustained Attention",
    marker: "Sustained Attention - stable, continuous attention on breath",
    hindrance: "Subtle Wandering - very subtle movements of attention away from object",
    techniques: [
      "mindful presence",
      "content presence",
      "calm abiding",
      "tranquility and seclusion",
      "increasing stability"
    ],
    progressionCriteria: "Attention remains stable for extended periods, subtle wandering diminishes"
  },
  "10": {
    id: "10",
    name: "Whole-Body Breathing",
    marker: "Whole-Body Breathing - awareness pervades entire body with breathing",
    hindrance: "Sensory Stimulation - distraction by sounds, sensations, external stimuli",
    techniques: [
      "breathing throughout body",
      "whole body breathing",
      "withdrawing from senses",
      "intimate body breathing"
    ],
    progressionCriteria: "Breath awareness fills whole body, external distractions fade"
  },
  "11": {
    id: "11",
    name: "Sustained Awareness",
    marker: "Sustained Awareness - continuous intimate awareness of pleasant breathing",
    hindrance: "Anticipation of Pleasure - craving for pleasant experiences, grasping",
    techniques: [
      "intimacy with pleasantness",
      "sustained awareness",
      "letting go of anticipation",
      "resting in present pleasantness"
    ],
    progressionCriteria: "Continuous pleasant awareness without grasping, piti and sukha present"
  },
  "12": {
    id: "12",
    name: "Access Concentration",
    marker: "Access Concentration - stable unified awareness, gateway to jhana",
    hindrance: "Fear of Letting Go - resistance to deeper states, fear of losing control",
    techniques: [
      "access concentration",
      "letting go deeply",
      "absorbing into pleasantness",
      "releasing fear"
    ],
    progressionCriteria: "Stable access concentration, able to rest at gateway to jhana"
  },
  "13": {
    id: "13",
    name: "First Pleasure Jhana",
    marker: "Pleasure Jhana - absorbed in blissful pleasure (piti)",
    hindrance: "Attachment to Pleasure - clinging to pleasant states",
    techniques: [
      "absorbing into piti",
      "resting in bliss",
      "allowing absorption",
      "pervading body with piti"
    ],
    progressionCriteria: "Able to enter and abide in first jhana"
  },
  "14": {
    id: "14",
    name: "Second Pleasure Jhana",
    marker: "Happy Jhana - refined happiness (sukha) predominates",
    hindrance: "Restless Energy - subtle agitation within jhana",
    techniques: [
      "inclining toward sukha",
      "absorbing into sukha",
      "pervading with happiness",
      "refining pleasure"
    ],
    progressionCriteria: "Able to enter and abide in second jhana"
  },
  "15": {
    id: "15",
    name: "Third Pleasure Jhana",
    marker: "Content Jhana - equanimous contentment predominates",
    hindrance: "Subtle Discontent - subtle dissatisfaction or restlessness",
    techniques: [
      "separating joy from happiness",
      "resting in contentment",
      "deepening equanimity"
    ],
    progressionCriteria: "Able to enter and abide in third jhana"
  },
  "16": {
    id: "16",
    name: "Fourth Pleasure Jhana",
    marker: "Equanimity Jhana - profound equanimous stillness",
    hindrance: "Subtle Preferences - very subtle likes and dislikes",
    techniques: [
      "separating happiness from contentment",
      "absorbing into equanimity",
      "pervading with equanimity",
      "profound stillness"
    ],
    progressionCriteria: "Able to enter and abide in fourth jhana"
  }
};
