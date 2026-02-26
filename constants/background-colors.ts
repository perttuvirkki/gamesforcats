export interface BackgroundColorOption {
  id: string;
  name: string;
  color: string;
}

export const BACKGROUND_COLOR_OPTIONS: BackgroundColorOption[] = [
  { id: 'white', name: 'White', color: '#FFFFFF' },
  { id: 'cheese', name: 'Cheese', color: '#FFD54F' },
  { id: 'pond', name: 'Pond', color: '#4FC3F7' },
  { id: 'honey', name: 'Honey', color: '#FFA000' },
  { id: 'ocean', name: 'Ocean', color: '#0288D1' },
  { id: 'charcoal', name: 'Charcoal', color: '#212121' },
  { id: 'navy', name: 'Navy', color: '#0D1B2A' },
];
