import { supabase } from '../lib/supabase.js';

const inMemoryPayments = new Map();

export const paymentsRepository = {
  async upsertPayment(record) {
    if (!supabase) {
      inMemoryPayments.set(record.reference_id, record);
      return;
    }

    const { error } = await supabase.from('payment_transactions').upsert(record, {
      onConflict: 'reference_id',
    });
    if (error) throw error;
  },

  async getPaymentByReference(referenceId) {
    if (!supabase) {
      return inMemoryPayments.get(referenceId) || null;
    }

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('reference_id', referenceId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async updateBookingRequestStatusByReference(referenceId, webhookStatus) {
    if (!supabase) return;

    const { error } = await supabase
      .from('booking_requests')
      .update({ paymentWebhookStatus: webhookStatus, updated_at: new Date().toISOString() })
      .eq('paymentReferenceId', referenceId);
    if (error) throw error;
  },
};
