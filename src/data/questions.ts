import type { Question } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 'decision_style',
    title: 'Which best describes your approach to making business decisions?',
    layout: 'icons',
    options: [
      { id: 'analytical', label: 'Analytical', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F326110f362024b59902872639764da83?format=webp&width=800' },
      { id: 'intuitive', label: 'Intuitive', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2Fa033e10c071a42e19ad172d6988aea79?format=webp&width=800' },
      { id: 'collaborative', label: 'Collaborative', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F734d99d9b7254347863862923d3961aa?format=webp&width=800' },
      { id: 'opportunistic', label: 'Opportunistic', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2Ff37d8c00cdd648fa870715933cd5e8d0?format=webp&width=800' },
    ],
  },
  {
    id: 'innovation',
    title: 'Which mindset do you most identify with when new technologies emerge?',
    layout: 'radio-list',
    options: [
      { id: 'conservative', label: 'Conservative' },
      { id: 'experimental', label: 'Experimental' },
      { id: 'early_adopter', label: 'Early adopter' },
      { id: 'disruptive', label: 'Disruptive' },
    ],
  },
  {
    id: 'risk',
    title: 'With new opportunities, how would you describe your risk tolerance?',
    layout: 'dial',
    options: [
      { id: 'low', label: 'Low', value: 0 },
      { id: 'medium', label: 'Medium', value: 50 },
      { id: 'high', label: 'High', value: 100 },
    ],
  },
  {
    id: 'collaboration',
    title: 'When working on a team project, which approach best describes your style?',
    layout: 'icons',
    options: [
      { id: 'independent', label: 'Independent', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F0f924d10a9004ece81801170ff3120bc?format=webp&width=800' },
      { id: 'team_player', label: 'Team player', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F3ea631f044214ea694881dbdc7cb09c0?format=webp&width=800' },
      { id: 'networker', label: 'Networker', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2Fc8a134459f504ebc902e82a27543cbd9?format=webp&width=800' },
      { id: 'xfunctional_lead', label: 'Cross-functional leader', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2Fbd297adeb12f421fa4fea943a15e0a4d?format=webp&width=800' },
    ],
  },
  {
    id: 'vision',
    title: 'When defining your vision for the future, which area is your primary focus?',
    layout: 'radio-list',
    options: [
      { id: 'operational_efficiency', label: 'Operational efficiency' },
      { id: 'market_trends', label: 'Market trends' },
      { id: 'tech_adoption', label: 'Technology adoption' },
      { id: 'industry_transformation', label: 'Industry transformation' },
    ],
  },
];
