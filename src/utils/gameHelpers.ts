import { BingoCard, DrawnNumber, BingoLetter, BingoPattern } from '../types';

export const generateBingoCard = (): BingoCard => {
  const generateColumnNumbers = (min: number, max: number, count: number = 5): number[] => {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  };

  return {
    B: generateColumnNumbers(1, 15),
    I: generateColumnNumbers(16, 30),
    N: generateColumnNumbers(31, 45),
    G: generateColumnNumbers(46, 60),
    O: generateColumnNumbers(61, 75),
  };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getNumberRange = (letter: BingoLetter): [number, number] => {
  const ranges = {
    B: [1, 15] as [number, number],
    I: [16, 30] as [number, number],
    N: [31, 45] as [number, number],
    G: [46, 60] as [number, number],
    O: [61, 75] as [number, number],
  };
  return ranges[letter];
};

export const isValidBingoNumber = (letter: BingoLetter, number: number): boolean => {
  const [min, max] = getNumberRange(letter);
  return number >= min && number <= max;
};

export const getPatternDifficulty = (pattern: BingoPattern): 'easy' | 'medium' | 'hard' => {
  const difficulties = {
    one_line: 'easy' as const,
    two_lines: 'medium' as const,
    three_lines: 'hard' as const,
    full_house: 'hard' as const,
    t_shape: 'medium' as const,
    u_shape: 'medium' as const,
    x_shape: 'medium' as const,
    l_shape: 'medium' as const,
    plus_sign: 'easy' as const,
    diamond: 'medium' as const,
  };
  return difficulties[pattern] || 'medium';
};

export const calculateGameDuration = (startTime: Date, endTime?: Date): number => {
  const end = endTime || new Date();
  return Math.floor((end.getTime() - startTime.getTime()) / 1000);
};

export const getRandomCelebrationMessage = (): string => {
  const messages = [
    'Fantastic!',
    'Amazing!',
    'Incredible!',
    'Outstanding!',
    'Brilliant!',
    'Spectacular!',
    'Wonderful!',
    'Excellent!',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getLetterColor = (letter: BingoLetter): string => {
  const colors = {
    B: '#2563EB',
    I: '#3B82F6',
    N: '#1D4ED8',
    G: '#10B981',
    O: '#F59E0B',
  };
  return colors[letter];
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};