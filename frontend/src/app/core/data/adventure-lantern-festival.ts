import type { ResonanceAxis } from '../services/player-store.service';

export interface AdventureChoice {
  id: string;
  label: string;
  axis: ResonanceAxis;
  axisPoints: number;
}

export interface AdventureNode {
  id: string;
  body: string;
  choices: AdventureChoice[];
  /** If set, one choice label is replaced per starter echo id. */
  starterFlavor?: Record<string, string>;
}

export interface AdventureDefinition {
  id: string;
  title: string;
  nodes: AdventureNode[];
  endings: Record<string, { title: string; body: string }>;
}

export const LANTERN_FESTIVAL_ADVENTURE: AdventureDefinition = {
  id: 'lantern-festival',
  title: 'The Fading Lantern Festival',
  nodes: [
    {
      id: 'opening',
      body: 'The old Lantern Festival grounds shimmer back into existence. Your Echo tugs you forward excitedly.',
      choices: [{ id: 'go', label: 'Step into the glow', axis: 'courage', axisPoints: 2 }],
    },
    {
      id: 'broken-path',
      body: 'A broken path blocks the way — gaps flicker with soft light.',
      choices: [
        { id: 'dance', label: 'Cheer them on and dance through', axis: 'joy', axisPoints: 3 },
        { id: 'guide', label: 'Guide them step-by-step', axis: 'harmony', axisPoints: 2 },
        { id: 'leap', label: 'Leap ahead bravely', axis: 'courage', axisPoints: 3 },
      ],
    },
    {
      id: 'fading-lanterns',
      body: 'Lanterns along the path are dim. Your Echo hums, waiting for your idea.',
      choices: [
        { id: 'fluff', label: 'Warm sparks to relight them', axis: 'joy', axisPoints: 2 },
        { id: 'drop', label: 'Gather dewdrops to make them glow', axis: 'harmony', axisPoints: 2 },
        { id: 'sprout', label: 'Weave vines to hold them steady', axis: 'discipline', axisPoints: 2 },
        { id: 'spark', label: 'Send a quick zap to spark them back', axis: 'courage', axisPoints: 2 },
      ],
      starterFlavor: {
        fluffling_web: 'Breathe warm sparks to relight them',
        droplet_web: 'Gather dewdrops to make them glow again',
        sprout_web: 'Weave fresh vines to hold them steady',
        spark_web: 'Send a quick zap to spark them back',
      },
    },
    {
      id: 'central-lantern',
      body: 'The great central lantern flickers weakly. Your Echo looks to you.',
      choices: [
        { id: 'joy', label: 'Pour shared joyful energy', axis: 'joy', axisPoints: 3 },
        { id: 'firm', label: 'Stand firm and protect it', axis: 'courage', axisPoints: 2 },
        { id: 'song', label: 'Sing a quiet harmony song', axis: 'harmony', axisPoints: 3 },
      ],
    },
    {
      id: 'finale',
      body: 'The festival stirs one last time. How do you close the night?',
      choices: [
        { id: 'celebrate', label: 'Celebrate under the lights', axis: 'joy', axisPoints: 2 },
        { id: 'guard', label: 'Keep watch until dawn', axis: 'discipline', axisPoints: 2 },
        { id: 'wander', label: 'Wander the quiet rifts', axis: 'courage', axisPoints: 2 },
      ],
    },
  ],
  endings: {
    joy: {
      title: 'Lanterns of Laughter',
      body: 'The sky fills with bright, playful lanterns. Your Echo beams!',
    },
    courage: {
      title: 'Beacon of Bravery',
      body: 'The lanterns blaze strong — a beacon of bravery across the rift.',
    },
    harmony: {
      title: 'Warm Tide of Light',
      body: 'A gentle wave of warm light spreads. You both feel deeply connected.',
    },
    discipline: {
      title: 'Steady Glow',
      body: 'Each lantern holds its flame with calm precision. Your bond deepens.',
    },
    balanced: {
      title: 'Prism Lantern',
      body: 'A rare prism lantern rises — all colors swirl in perfect balance!',
    },
  },
};

export function resolveAdventureEnding(
  scores: Record<ResonanceAxis, number>,
): { endingId: string; dominantAxis: ResonanceAxis } {
  const axes: ResonanceAxis[] = ['joy', 'discipline', 'courage', 'harmony'];
  const sorted = [...axes].sort((a, b) => scores[b] - scores[a]);
  const top = scores[sorted[0]];
  const second = scores[sorted[1]];

  if (top > 0 && top === second) {
    const spread = top - (scores[sorted[2]] ?? 0);
    if (spread <= 1) {
      return { endingId: 'balanced', dominantAxis: 'harmony' };
    }
  }

  return { endingId: sorted[0], dominantAxis: sorted[0] };
}
