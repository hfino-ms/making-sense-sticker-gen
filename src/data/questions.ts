import type { Question } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 'decision_style',
    title: 'Decision-making style',
    options: [
      { id: 'analytical', label: 'Analytical' },
      { id: 'intuitive', label: 'Intuitive' },
      { id: 'collaborative', label: 'Collaborative' },
      { id: 'opportunistic', label: 'Opportunistic' },
    ],
  },
  {
    id: 'innovation',
    title: 'Approach to innovation',
    options: [
      { id: 'conservative', label: 'Conservative' },
      { id: 'experimental', label: 'Experimental' },
      { id: 'early_adopter', label: 'Early Adopter' },
      { id: 'disruptive', label: 'Disruptive' },
    ],
  },
  {
    id: 'risk',
    title: 'Risk tolerance',
    options: [
      { id: 'low', label: 'Low' },
      { id: 'medium', label: 'Medium' },
      { id: 'high', label: 'High' },
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration style',
    options: [
      { id: 'independent', label: 'Independent' },
      { id: 'team_player', label: 'Team Player' },
      { id: 'networker', label: 'Networker' },
      { id: 'xfunctional_lead', label: 'Cross-functional Leader' },
    ],
  },
  {
    id: 'vision',
    title: 'Primary focus',
    options: [
      { id: 'operational_efficiency', label: 'Operational Efficiency' },
      { id: 'market_trends', label: 'Market Trends' },
      { id: 'tech_adoption', label: 'Technology Adoption' },
      { id: 'industry_transformation', label: 'Industry Transformation' },
    ],
  },
];
