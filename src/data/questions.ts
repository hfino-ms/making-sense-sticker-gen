import type { Question } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 'decision_making',
    title: 'Q1 – Decision-Making Approach\nWhen evaluating a potential investment, how do you typically approach decision-making?',
    layout: 'icons',
    options: [
      { id: 'data_driven', label: 'Data-driven', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/a401344c9969a5d400f54f55c2592626ea2c0298?width=150' },
      { id: 'hybrid', label: 'Hybrid', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/0ac811bd05f6ddc8bf847ddb3489b5c2754116e8?width=150' },
      { id: 'balanced_mix', label: 'Balanced mix', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/99cb3257a361ef479d90e8b0e558ef7cf2d532af?width=150' },
      { id: 'intuition', label: 'Intuition', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/e289af3638361847320c030d3370ce41e910bb8d?width=150' },
    ],
  },
  {
    id: 'tech_adoption',
    title: 'Q2 – Adapting to New Tech\nWhen a new technology emerges in the market, how do you respond?',
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
    title: 'Q3 – Risk Appetite\nWhen considering a new opportunity, what best describes your risk tolerance?',
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
    title: "Q4 – Team Dynamics\nWhen working with portfolio company teams, what's your default style?",
    layout: 'icons',
    options: [
      { id: 'hands_on', label: 'Hands-on', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/07bc8535d78138efef9d77a8db3b62907525c1e7?width=150' },
      { id: 'collaborative', label: 'Collaborative', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/8fb194a4000ebffa552aa2939002a52b3c5b7a93?width=150' },
      { id: 'advisory', label: 'Advisory', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/d50eed6283dfd5b3aeca7fe04f7541b5a9b40e10?width=150' },
      { id: 'delegative', label: 'Delegative', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/164e51f9e7d3f94218adc5720da7c1485c3c90e4?width=150' },
    ],
  },
  {
    id: 'growth_priorities',
    title: 'Q5 – Growth Priorities\nWhen defining a growth plan for a portfolio company, which area do you prioritize first?',
    layout: 'radio-list',
    options: [
      { id: 'operational_efficiency', label: 'Operational efficiency' },
      { id: 'market_expansion', label: 'Market expansion' },
      { id: 'innovation', label: 'Innovation' },
      { id: 'talent_strengthening', label: 'Talent strengthening' },
    ],
  },
];
