import { Difficulty } from './types';

export const LEVEL_CONFIG: Record<Difficulty, { label: string; description: string }> = {
  '2-1': {
    label: '2けた ÷ 1けた',
    description: 'まずはここから！基本の筆算。'
  },
  '3-1': {
    label: '3けた ÷ 1けた',
    description: '少し長くなります。丁寧にやりましょう。'
  },
  '2-2': {
    label: '2けた ÷ 2けた',
    description: '「たてる」数の見当をつけよう。'
  },
  '3-2': {
    label: '3けた ÷ 2けた',
    description: '4年生のクライマックス！'
  }
};
