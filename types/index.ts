export type EventCategory =
  | 'birthday'
  | 'wedding'
  | 'reception'
  | 'engagement'
  | 'babyshower'
  | 'housewarming'
  | 'graduation'
  | 'corporate'
  | 'cultural'
  | 'festival';

export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  description: string;
  image: string;
  price: number;
  duration: string;
  rating: number;
  reviewCount: number;
  features: string[];
}

export interface Review {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
}



export interface Vendor {
  id: string;
  name: string;
  category: 'caterer' | 'decorator' | 'photographer' | 'music' | 'other';
  description: string;
  image: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  services: string[];
  portfolio: string[];
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  images?: string[];
}

export interface AIRoomTransformation {
  id: string;
  originalImage: string;
  transformedImage: string;
  eventType: EventCategory;
  style: 'traditional' | 'modern' | 'luxury' | 'budget';
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  nickname?: string;
  role: UserRole;
  onboardingCompleted?: boolean;
  profileCompletion?: number;
  city?: string;
  budgetTier?: BudgetTier;
  styleTags?: EventStyle[];
  favoriteCategories?: EventCategory[];
  notificationChannels?: NotificationChannel[];
  aiTone?: AiTone;
}

export type UserRole = 'customer' | 'planner' | 'vendor';

export type BudgetTier = 'budget' | 'balanced' | 'premium';
export type AiTone = 'concise' | 'balanced' | 'cinematic';
export type EventStyle = 'modern' | 'traditional' | 'luxury' | 'minimal' | 'boho';
export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'event_admin' | 'ai_manager';
  createdAt: string;
}



export interface VendorBooking {
  id: string;
  vendorId: string;
  vendor: Vendor;
  userId: string;
  user: User;
  eventDate: string;
  guestCount: number;
  budget?: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PaymentIntentResponse {
  provider: 'stripe' | 'razorpay';
  referenceId: string;
  status: 'created' | 'pending' | 'paid' | 'failed';
  clientSecret?: string;
  checkoutUrl?: string;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  bookingStatusBreakdown: Record<'pending' | 'approved' | 'rejected', number>;
  monthlyRevenue: { month: string; value: number }[];
  categoryPopularity: { category: string; count: number }[];
  vendorEarnings: { vendorId: string; vendorName: string; earnings: number }[];
  bookingHeatmap: { date: string; count: number }[];
  trendingStyles: { name: string; type: 'color' | 'decor'; count: number }[];
}

export interface BookingRequest {
  id: string;
  eventId: string;
  event: Event;
  userId: string;
  user: User;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  guestCount: number;
  venue: string;
  contactName: string;
  email: string;
  phone: string;
  specialRequests?: string;
  addOns?: AddOn[];
  createdAt: string;
  paymentGateway?: 'stripe' | 'razorpay';
  paymentReferenceId?: string;
  paymentWebhookStatus?: 'pending' | 'confirmed' | 'failed';
}

export interface UserEvent {
  id: string;
  eventId: string;
  event: Event;
  status: 'registered' | 'booked' | 'completed' | 'cancelled';
  date: string;
  guestCount: number;
  specialRequests?: string;
  addOns?: AddOn[];
  bookingDetails?: {
    contactName: string;
    email: string;
    phone: string;
    venue: string;
    paymentStatus: 'pending' | 'partial' | 'paid';
    amountPaid: number;
    totalAmount: number;
    paymentGateway?: 'stripe' | 'razorpay';
    paymentReferenceId?: string;
    paymentWebhookStatus?: 'pending' | 'confirmed' | 'failed';
  };
}
