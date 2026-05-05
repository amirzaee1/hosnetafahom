
export interface PageContent {
  id: number;
  title?: string;
  text: string;
  narrativeModel: NarrativeModel;
  highlights: string[];
  primarySentences: string[];
}

export enum NarrativeModel {
  INTERACTION = "interaction",
  SOCIAL_DISTANCE = "social_distance",
  COLD_TO_WARM = "cold_to_warm",
  SHARED_SPACE = "shared_space",
  CONTRAST = "contrast",
  GRADUAL_CLOSENESS = "gradual_closeness",
  REFLECTIVE = "reflective",
  HUMAN_NETWORK = "human_network"
}
