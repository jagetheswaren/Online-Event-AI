import { EventCategory } from '@/types';

export type UserRole = 'customer' | 'planner' | 'vendor';
export type BudgetTier = 'essential' | 'signature' | 'luxury';
export type VenueSize = 'small' | 'medium' | 'large';
export type DecorationStyle = 'traditional' | 'modern' | 'luxury' | 'budget';

export interface DistrictPricing {
  id: string;
  name: string;
  multiplier: number;
}

export interface BudgetBreakdownItem {
  id: string;
  label: string;
  percent: number;
  amount: number;
}

export interface BudgetEstimateInput {
  eventCategory: EventCategory;
  districtId: string;
  guestCount: number;
  tier: BudgetTier;
}

export interface BudgetEstimateResult {
  subtotal: number;
  contingency: number;
  total: number;
  perGuest: number;
  district: DistrictPricing;
  breakdown: BudgetBreakdownItem[];
  tips: string[];
}

export interface RoomTransformEstimateInput {
  eventCategory: EventCategory;
  districtId: string;
  guestCount: number;
  style: DecorationStyle;
  venueSize: VenueSize;
}

export interface RoomTransformEstimateResult {
  total: number;
  perGuest: number;
  district: DistrictPricing;
  style: DecorationStyle;
  breakdown: BudgetBreakdownItem[];
}

export const ROLE_OPTIONS: { id: UserRole; label: string; description: string }[] = [
  { id: 'customer', label: 'Customer', description: 'Book events and track your plans' },
  { id: 'planner', label: 'Planner', description: 'Build plans with advanced AI tools' },
  { id: 'vendor', label: 'Vendor', description: 'Receive and manage event opportunities' },
];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  birthday: 'Birthday',
  wedding: 'Wedding',
  reception: 'Reception',
  engagement: 'Engagement',
  babyshower: 'Baby Shower',
  housewarming: 'Housewarming',
  graduation: 'Graduation',
  corporate: 'Corporate',
  cultural: 'Cultural',
  festival: 'Festival',
};

export const DISTRICT_PRICING: DistrictPricing[] = [
  { id: 'mumbai', name: 'Mumbai', multiplier: 1.35 },
  { id: 'delhi', name: 'Delhi NCR', multiplier: 1.28 },
  { id: 'bengaluru', name: 'Bengaluru', multiplier: 1.22 },
  { id: 'hyderabad', name: 'Hyderabad', multiplier: 1.16 },
  { id: 'chennai', name: 'Chennai', multiplier: 1.12 },
  { id: 'kolkata', name: 'Kolkata', multiplier: 1.08 },
  { id: 'pune', name: 'Pune', multiplier: 1.14 },
  { id: 'jaipur', name: 'Jaipur', multiplier: 1.03 },
  { id: 'lucknow', name: 'Lucknow', multiplier: 0.98 },
  { id: 'indore', name: 'Indore', multiplier: 0.95 },
];

const EVENT_BASE_PRICE_PER_GUEST: Record<EventCategory, number> = {
  birthday: 1300,
  wedding: 3800,
  reception: 2650,
  engagement: 1900,
  babyshower: 1450,
  housewarming: 1150,
  graduation: 1350,
  corporate: 2400,
  cultural: 2100,
  festival: 1750,
};

const BUDGET_TIER_MULTIPLIER: Record<BudgetTier, number> = {
  essential: 0.86,
  signature: 1,
  luxury: 1.34,
};

const ROOM_STYLE_MULTIPLIER: Record<DecorationStyle, number> = {
  traditional: 1.03,
  modern: 1.08,
  luxury: 1.28,
  budget: 0.82,
};

const VENUE_SIZE_MULTIPLIER: Record<VenueSize, number> = {
  small: 0.84,
  medium: 1,
  large: 1.22,
};

const BUDGET_BREAKDOWN_WEIGHTS: Omit<BudgetBreakdownItem, 'amount'>[] = [
  { id: 'venue', label: 'Venue & Operations', percent: 34 },
  { id: 'decor', label: 'Decor & Styling', percent: 21 },
  { id: 'catering', label: 'Food & Beverage', percent: 25 },
  { id: 'entertainment', label: 'Entertainment', percent: 8 },
  { id: 'media', label: 'Photography & Media', percent: 7 },
  { id: 'logistics', label: 'Invites, Transport, Utilities', percent: 5 },
];

const ROOM_BREAKDOWN_WEIGHTS: Omit<BudgetBreakdownItem, 'amount'>[] = [
  { id: 'entry-stage', label: 'Entry + Stage Styling', percent: 28 },
  { id: 'floral-theme', label: 'Floral + Theme Assets', percent: 24 },
  { id: 'light-effects', label: 'Lighting + Effects', percent: 18 },
  { id: 'tables-seating', label: 'Tables + Seating Decor', percent: 16 },
  { id: 'labor', label: 'Fabrication + Labor', percent: 14 },
];

const DEFAULT_DISTRICT = DISTRICT_PRICING[0];
const CONTINGENCY_RATE = 0.08;

export const getDistrictById = (districtId: string): DistrictPricing =>
  DISTRICT_PRICING.find((district) => district.id === districtId) || DEFAULT_DISTRICT;

const normalizeGuestCount = (guestCount: number): number => {
  if (!Number.isFinite(guestCount)) return 50;
  return Math.max(20, Math.min(5000, Math.round(guestCount)));
};

const buildBreakdown = (
  subtotal: number,
  weights: Omit<BudgetBreakdownItem, 'amount'>[]
): BudgetBreakdownItem[] => {
  const rounded = weights.map((item) => ({
    ...item,
    amount: Math.round((subtotal * item.percent) / 100),
  }));
  const consumed = rounded.reduce((sum, item) => sum + item.amount, 0);
  const delta = subtotal - consumed;

  if (delta !== 0 && rounded.length > 0) {
    rounded[0] = {
      ...rounded[0],
      amount: rounded[0].amount + delta,
    };
  }

  return rounded;
};

const buildBudgetTips = (input: BudgetEstimateInput, total: number): string[] => {
  const district = getDistrictById(input.districtId);
  const tips: string[] = [];

  if (district.multiplier >= 1.2) {
    tips.push('High-demand district detected. Booking venue 90+ days early can reduce costs by 8-12%.');
  }
  if (input.tier === 'luxury') {
    tips.push('Luxury tier selected. Keep 10% reserve for premium vendors and weather contingencies.');
  }
  if (input.guestCount > 350) {
    tips.push('Large guest count detected. Buffet-style layout usually lowers catering spend per guest.');
  }
  if (total > 1000000) {
    tips.push('Consider splitting payments by milestone (venue, decor, operations) to improve cash flow control.');
  }
  if (tips.length === 0) {
    tips.push('Your selected configuration is balanced. Keep 8% contingency to avoid last-minute overruns.');
  }

  return tips;
};

export const calculateBudgetEstimate = (input: BudgetEstimateInput): BudgetEstimateResult => {
  const district = getDistrictById(input.districtId);
  const guests = normalizeGuestCount(input.guestCount);
  const basePerGuest = EVENT_BASE_PRICE_PER_GUEST[input.eventCategory];
  const tierMultiplier = BUDGET_TIER_MULTIPLIER[input.tier];

  const subtotal = Math.round(basePerGuest * guests * district.multiplier * tierMultiplier);
  const contingency = Math.round(subtotal * CONTINGENCY_RATE);
  const total = subtotal + contingency;
  const breakdown = buildBreakdown(subtotal, BUDGET_BREAKDOWN_WEIGHTS);

  return {
    subtotal,
    contingency,
    total,
    perGuest: Math.round(total / guests),
    district,
    breakdown,
    tips: buildBudgetTips({ ...input, guestCount: guests }, total),
  };
};

export const calculateRoomTransformationEstimate = (
  input: RoomTransformEstimateInput
): RoomTransformEstimateResult => {
  const district = getDistrictById(input.districtId);
  const guests = normalizeGuestCount(input.guestCount);
  const basePerGuest = EVENT_BASE_PRICE_PER_GUEST[input.eventCategory];
  const decorBase = basePerGuest * 0.33;
  const styleMultiplier = ROOM_STYLE_MULTIPLIER[input.style];
  const venueMultiplier = VENUE_SIZE_MULTIPLIER[input.venueSize];

  const subtotal = Math.round(decorBase * guests * district.multiplier * styleMultiplier * venueMultiplier);
  const breakdown = buildBreakdown(subtotal, ROOM_BREAKDOWN_WEIGHTS);

  return {
    total: subtotal,
    perGuest: Math.round(subtotal / guests),
    district,
    style: input.style,
    breakdown,
  };
};
