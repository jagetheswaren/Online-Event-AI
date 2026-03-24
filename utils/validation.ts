// Form validation utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

export const validateGuestCount = (count: string): boolean => {
  const num = parseInt(count);
  return !isNaN(num) && num > 0 && num <= 10000;
};

export const validateAmount = (amount: string): boolean => {
  const num = parseInt(amount);
  return !isNaN(num) && num > 0 && num <= 10000000;
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().substring(0, 500);
};

export interface ValidationError {
  field: string;
  message: string;
}

export const validateBookingForm = (data: {
  name: string;
  email: string;
  phone: string;
  date: string;
  guestCount: string;
  venue: string;
  paymentAmount: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!validateName(data.name)) {
    errors.push({ field: 'name', message: 'Name must be 2-100 characters' });
  }

  if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email' });
  }

  if (!validatePhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
  }

  if (!validateDate(data.date)) {
    errors.push({ field: 'date', message: 'Please select a future date' });
  }

  if (!validateGuestCount(data.guestCount)) {
    errors.push({ field: 'guestCount', message: 'Guest count must be 1-10000' });
  }

  if (!data.venue || data.venue.trim().length === 0) {
    errors.push({ field: 'venue', message: 'Venue is required' });
  }

  if (!validateAmount(data.paymentAmount)) {
    errors.push({ field: 'paymentAmount', message: 'Invalid payment amount' });
  }

  return errors;
};
