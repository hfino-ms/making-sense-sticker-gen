import type { Question } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 'decision_making',
    title: 'When evaluating a potential investment, how do you typically approach decision-making?',
    layout: 'icons',
    options: [
      { id: 'data_driven', label: 'Data-driven', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/a401344c9969a5d400f54f55c2592626ea2c0298?width=150' },
      { id: 'hybrid', label: 'Hybrid', icon: 'https://i.imgur.com/07Np3Ec.png' },
      { id: 'balanced_mix', label: 'Balanced mix', icon: 'https://i.imgur.com/7xJKshN.png' },
      { id: 'intuition', label: 'Intuition', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/0ac811bd05f6ddc8bf847ddb3489b5c2754116e8?width=150' },
    ],
  },
  {
    id: 'tech_adoption',
    title: 'When a new technology emerges in the market, how do you respond?',
    layout: 'radio-list',
    options: [
      { id: 'disruptor', label: 'Disruptor' },
      { id: 'tester', label: 'Tester' },
      { id: 'observer', label: 'Observer' },
      { id: 'late_adopter', label: 'Late Adopter' },
    ],
  },
  {
    id: 'risk_appetite',
    title: 'When considering a new opportunity, what best describes your risk tolerance?',
    layout: 'dial',
    options: [
      { id: 'low', label: 'Low', value: 0 },
      { id: 'moderate_low', label: 'Moderate-Low', value: 25 },
      { id: 'moderate_high', label: 'Moderate-High', value: 75 },
      { id: 'high', label: 'High', value: 100 },
    ],
  },
  {
    id: 'team_dynamics',
    title: "When working with portfolio company teams, what's your default style?",
    layout: 'icons',
    options: [
      { id: 'hands_on', label: 'Hands-on', icon: 'https://i.imgur.com/vxyaPF0.png' },
      { id: 'collaborative', label: 'Collaborative', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/8fb194a4000ebffa552aa2939002a52b3c5b7a93?width=150' },
      { id: 'advisory', label: 'Advisory', icon: 'https://i.imgur.com/xn0Xx3m.png' },
      { id: 'delegative', label: 'Delegative', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/164e51f9e7d3f94218adc5720da7c1485c3c90e4?width=150' },
    ],
  },
  {
    id: 'growth_priorities',
    title: 'When defining a growth plan for a portfolio company, which area do you prioritize first?',
    layout: 'radio-list',
    options: [
      { id: 'operational_efficiency', label: 'Operational efficiency' },
      { id: 'market_expansion', label: 'Market expansion' },
      { id: 'innovation', label: 'Innovation' },
      { id: 'talent_strengthening', label: 'Talent strengthening' },
    ],
  },
];
