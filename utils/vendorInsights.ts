import { Vendor } from '@/types';

export interface VendorAiInsights {
  compatibilityScore: number;
  matchReasons: string[];
  similarEventSuccessRate: number;
  onTimeRate: number;
  repeatBookingRate: number;
  satisfactionTrend: number[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const CATEGORY_BASE_SCORE: Record<Vendor['category'], number> = {
  caterer: 88,
  decorator: 92,
  photographer: 86,
  music: 84,
  other: 80,
};

const parsePriceBand = (priceRange: string) => {
  const cleaned = priceRange.replace(/,/g, '');
  const matches = cleaned.match(/\d+/g);
  if (!matches || matches.length === 0) return { min: 0, max: 0 };
  const values = matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (values.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

export const getVendorAiInsights = (
  vendor: Vendor,
  options?: { selectedCategory?: string }
): VendorAiInsights => {
  const { min, max } = parsePriceBand(vendor.priceRange);
  const budgetShift = max > 0 ? (max <= 90000 ? 4 : max <= 160000 ? 1 : -2) : 0;
  const reviewSignal = Math.min(vendor.reviewCount, 220) / 18;
  const categoryBoost =
    options?.selectedCategory && options.selectedCategory !== 'all'
      ? options.selectedCategory === vendor.category
        ? 7
        : -8
      : 0;

  const compatibilityScore = clamp(
    Math.round(
      CATEGORY_BASE_SCORE[vendor.category] +
        (vendor.rating - 4) * 10 +
        reviewSignal +
        vendor.services.length * 0.8 +
        budgetShift +
        categoryBoost
    ),
    70,
    99
  );

  const onTimeRate = clamp(
    Math.round(82 + (vendor.rating - 4) * 16 + Math.min(vendor.reviewCount, 250) / 22),
    76,
    99
  );

  const repeatBookingRate = clamp(
    Math.round(18 + (vendor.rating - 4) * 24 + Math.min(vendor.reviewCount, 250) / 9),
    14,
    82
  );

  const satisfactionBase = clamp(Math.round(vendor.rating * 18 + 9), 78, 99);
  const satisfactionTrend = [-6, -3, -1, 1, 3, 5].map((offset) =>
    clamp(satisfactionBase + offset, 72, 99)
  );

  const similarEventSuccessRate = clamp(
    Math.round((compatibilityScore + onTimeRate + satisfactionBase) / 3),
    72,
    99
  );

  const priceSignal =
    min > 0 && max > 0
      ? `Price band ${vendor.priceRange} fits the expected planning budget range.`
      : 'Pricing structure is aligned for scalable event plans.';

  const matchReasons = [
    `${vendor.services.slice(0, 2).join(' + ')} coverage aligns with common event requirements.`,
    `${vendor.reviewCount}+ verified client reviews with ${vendor.rating.toFixed(1)}/5 average rating.`,
    priceSignal,
  ];

  return {
    compatibilityScore,
    matchReasons,
    similarEventSuccessRate,
    onTimeRate,
    repeatBookingRate,
    satisfactionTrend,
  };
};

export const getDreamTeamDiscountPercent = (teamSize: number) => {
  if (teamSize >= 4) return 14;
  if (teamSize === 3) return 10;
  if (teamSize === 2) return 6;
  return 0;
};

export const buildDreamTeamChatPrefill = (
  vendors: Vendor[],
  discountPercent: number
) => {
  const vendorList = vendors.map((vendor) => `${vendor.name} (${vendor.category})`).join(', ');
  return [
    'Create a shared planning room for this Dream Team.',
    `Vendors: ${vendorList}`,
    `Bundle discount target: ${discountPercent}%`,
    'Generate a unified timeline, dependency checklist, and handoff plan across these vendors.',
  ].join(' ');
};

