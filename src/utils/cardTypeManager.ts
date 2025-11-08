import { WORLD_BINGO_CARDS } from '../data/worldbingodata';
import { AFRICA_BINGO_CARDS } from '../data/africabingodata';

export interface CardTypeInfo {
  name: string;
  displayName: string;
  cards: number[][];
  maxLimit: number;
}

/**
 * Get card data and info based on the selected card type
 */
export const getCardTypeInfo = (
  selectedCardTypeName: string, 
  customCardTypes: any[] = []
): CardTypeInfo => {
  console.log('🃏 Getting card type info for:', selectedCardTypeName);
  
  // Handle built-in card types first
  switch (selectedCardTypeName) {
    case 'World Bingo':
    case 'default':
      return {
        name: 'World Bingo',
        displayName: 'World Bingo',
        cards: WORLD_BINGO_CARDS,
        maxLimit: WORLD_BINGO_CARDS.length // 1000
      };
      
    case 'Africa Bingo':
    case 'africa':
      return {
        name: 'Africa Bingo',
        displayName: 'Africa Bingo',
        cards: AFRICA_BINGO_CARDS,
        maxLimit: AFRICA_BINGO_CARDS.length // 150
      };
  }
  
  // Handle custom card types
  if (customCardTypes && customCardTypes.length > 0) {
    const customType = customCardTypes.find(c => c.name === selectedCardTypeName);
    if (customType && customType.cards && customType.cards.length > 0) {
      return {
        name: customType.name,
        displayName: customType.displayName || customType.name,
        cards: customType.cards,
        maxLimit: customType.cards.length
      };
    }
    
    // Fallback to first custom type if selected type not found
    const fallbackType = customCardTypes.find(c => c.cards && c.cards.length > 0);
    if (fallbackType) {
      return {
        name: fallbackType.name,
        displayName: fallbackType.displayName || fallbackType.name,
        cards: fallbackType.cards,
        maxLimit: fallbackType.cards.length
      };
    }
  }
  
  // Final fallback to World Bingo
  console.log('⚠️ Card type not found, falling back to World Bingo');
  return {
    name: 'World Bingo',
    displayName: 'World Bingo',
    cards: WORLD_BINGO_CARDS,
    maxLimit: WORLD_BINGO_CARDS.length
  };
};

/**
 * Get available card types for selection
 */
export const getAvailableCardTypes = (customCardTypes: any[] = []): CardTypeInfo[] => {
  const builtInTypes: CardTypeInfo[] = [
    {
      name: 'World Bingo',
      displayName: 'World Bingo',
      cards: WORLD_BINGO_CARDS,
      maxLimit: WORLD_BINGO_CARDS.length
    },
    {
      name: 'Africa Bingo',
      displayName: 'Africa Bingo', 
      cards: AFRICA_BINGO_CARDS,
      maxLimit: AFRICA_BINGO_CARDS.length
    }
  ];
  
  const customTypes: CardTypeInfo[] = customCardTypes
    .filter(c => c.cards && c.cards.length > 0)
    .map(c => ({
      name: c.name,
      displayName: c.displayName || c.name,
      cards: c.cards,
      maxLimit: c.cards.length
    }));
    
  return [...builtInTypes, ...customTypes];
};

/**
 * Get the correct card array for checking cartelas in game
 * Uses the centralized card type logic for consistency
 */
export const getCardArrayForGame = (
  selectedCardTypeName: string,
  gameCustomCardTypes: any[] = [],
  fallbackCustomCardTypes: any[] = []
): number[][] => {
  console.log('🃏 Getting card array for game:', {
    selectedCardTypeName,
    hasGameCustomTypes: gameCustomCardTypes.length > 0,
    hasFallbackCustomTypes: fallbackCustomCardTypes.length > 0
  });
  
  // Try game-passed custom card types first
  if (gameCustomCardTypes && gameCustomCardTypes.length > 0) {
    const cardTypeInfo = getCardTypeInfo(selectedCardTypeName, gameCustomCardTypes);
    if (cardTypeInfo.cards && cardTypeInfo.cards.length > 0) {
      console.log('✅ Using game custom card type:', cardTypeInfo.name, 'with', cardTypeInfo.cards.length, 'cards');
      return cardTypeInfo.cards;
    }
  }
  
  // Then try fallback custom card types
  if (fallbackCustomCardTypes && fallbackCustomCardTypes.length > 0) {
    const cardTypeInfo = getCardTypeInfo(selectedCardTypeName, fallbackCustomCardTypes);
    if (cardTypeInfo.cards && cardTypeInfo.cards.length > 0) {
      console.log('✅ Using fallback custom card type:', cardTypeInfo.name, 'with', cardTypeInfo.cards.length, 'cards');
      return cardTypeInfo.cards;
    }
  }
  
  // Finally use built-in types (will fallback to World Bingo if not found)
  const cardTypeInfo = getCardTypeInfo(selectedCardTypeName, []);
  console.log('✅ Using built-in card type:', cardTypeInfo.name, 'with', cardTypeInfo.cards.length, 'cards');
  return cardTypeInfo.cards;
};

/**
 * Get the default limit for a card type
 */
export const getDefaultLimitForCardType = (selectedCardTypeName: string): number => {
  switch (selectedCardTypeName) {
    case 'Africa Bingo':
      return Math.min(150, AFRICA_BINGO_CARDS.length);
    case 'World Bingo':
    case 'default':
    default:
      return Math.min(1000, WORLD_BINGO_CARDS.length);
  }
};