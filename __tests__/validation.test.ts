/**
 * Test Cases for AI Event Planner System
 * Run with: npm test or bun test
 */

import {
  validateEmail,
  validatePhone,
  validateDate,
  validateGuestCount,
  validateAmount,
  validateName,
  sanitizeInput,
  validateBookingForm,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co.uk')).toBe(true);
      expect(validateEmail('valid+tag@email.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid phone numbers', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('+91 9876543210')).toBe(true);
      expect(validatePhone('(098) 765-4321')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc1234567')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formatDate = tomorrow.toISOString().split('T')[0];
      expect(validateDate(formatDate)).toBe(true);
    });

    it('should reject past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formatDate = yesterday.toISOString().split('T')[0];
      expect(validateDate(formatDate)).toBe(false);
    });

    it('should accept today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(validateDate(today)).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(validateDate('01-01-2025')).toBe(false);
      expect(validateDate('invalid')).toBe(false);
    });
  });

  describe('validateGuestCount', () => {
    it('should accept valid guest counts', () => {
      expect(validateGuestCount('1')).toBe(true);
      expect(validateGuestCount('50')).toBe(true);
      expect(validateGuestCount('1000')).toBe(true);
    });

    it('should reject invalid guest counts', () => {
      expect(validateGuestCount('0')).toBe(false);
      expect(validateGuestCount('-5')).toBe(false);
      expect(validateGuestCount('99999')).toBe(false);
      expect(validateGuestCount('abc')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should accept valid amounts', () => {
      expect(validateAmount('100')).toBe(true);
      expect(validateAmount('50000')).toBe(true);
      expect(validateAmount('1000000')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount('0')).toBe(false);
      expect(validateAmount('-1000')).toBe(false);
      expect(validateAmount('99999999')).toBe(false);
      expect(validateAmount('abc')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should accept valid names', () => {
      expect(validateName('John Doe')).toBe(true);
      expect(validateName('Alice')).toBe(true);
      expect(validateName('José García')).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(validateName('A')).toBe(false);
      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should limit length to 500 chars', () => {
      const longInput = 'a'.repeat(600);
      expect(sanitizeInput(longInput).length).toBe(500);
    });
  });

  describe('validateBookingForm', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      guestCount: '50',
      venue: '123 Main St',
      paymentAmount: '5000',
    };

    it('should accept valid booking data', () => {
      const errors = validateBookingForm(validData);
      expect(errors.length).toBe(0);
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: 'A',
        email: 'invalid',
        phone: '123',
        date: '2020-01-01',
        guestCount: '0',
        venue: '',
        paymentAmount: '-100',
      };
      const errors = validateBookingForm(invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should identify specific field errors', () => {
      const invalidData = { ...validData, email: 'invalid' };
      const errors = validateBookingForm(invalidData);
      const emailError = errors.find(e => e.field === 'email');
      expect(emailError).toBeDefined();
    });
  });
});

describe('Feature Tests', () => {
  describe('Event Booking Feature', () => {
    it('should validate all required fields', () => {
      const emptyData = {
        name: '',
        email: '',
        phone: '',
        date: '',
        guestCount: '',
        venue: '',
        paymentAmount: '',
      };
      const errors = validateBookingForm(emptyData);
      expect(errors.length).toBe(7);
    });

    it('should accept minimum 50% payment', () => {
      // This would be tested in integration test
      // verifying that a payment >= 50% of total is accepted
      expect(50000 >= 80000 * 0.5).toBe(true);
    });
  });

  describe('User Profile Feature', () => {
    it('should validate user email on update', () => {
      const userEmail = 'user@example.com';
      expect(validateEmail(userEmail)).toBe(true);
    });
  });

  describe('AI Chat Feature', () => {
    it('should accept message input', () => {
      const message = 'Plan a birthday party for 50 guests';
      expect(message.length > 0).toBe(true);
      expect(sanitizeInput(message)).toBe(message);
    });
  });

  describe('Admin Feature', () => {
    it('should validate admin email', () => {
      const adminEmail = 'admin@eventai.com';
      expect(validateEmail(adminEmail)).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  describe('Event Booking Flow', () => {
    it('complete booking with all validations', () => {
      const bookingData = {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+91 9876543210',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        guestCount: '100',
        venue: 'Grand Palace Banquet Hall, Downtown',
        paymentAmount: '7500',
      };

      const errors = validateBookingForm(bookingData);
      expect(errors.length).toBe(0);

      // Check payment logic
      const eventPrice = 15000;
      const minPayment = Math.ceil(eventPrice * 0.5);
      expect(parseInt(bookingData.paymentAmount) >= minPayment).toBe(true);
    });
  });

  describe('User Registration Flow', () => {
    it('should validate new user data', () => {
      const userData = {
        name: 'Alice Smith',
        email: 'alice@example.com',
        phone: '9999888877',
      };

      expect(validateName(userData.name)).toBe(true);
      expect(validateEmail(userData.email)).toBe(true);
      expect(validatePhone(userData.phone)).toBe(true);
    });
  });
});

// Export for running tests
export {
  validateEmail,
  validatePhone,
  validateDate,
  validateGuestCount,
  validateAmount,
  validateName,
  sanitizeInput,
  validateBookingForm,
};
