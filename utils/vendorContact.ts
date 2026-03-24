import { Alert, Linking } from 'react-native';
import { Vendor } from '@/types';

const FALLBACK_PHONE = '+919999999999';
const FALLBACK_EMAIL = 'vendor@eventai.demo';

const normalizePhone = (value: string) => value.replace(/[^+\d]/g, '');

const getPhone = (vendor: Vendor) => normalizePhone(vendor.contactPhone || FALLBACK_PHONE);

const getWhatsappPhone = (vendor: Vendor) =>
  normalizePhone(vendor.contactWhatsapp || vendor.contactPhone || FALLBACK_PHONE);

const getEmail = (vendor: Vendor) => vendor.contactEmail || FALLBACK_EMAIL;

const buildIntroMessage = (vendor: Vendor) =>
  `Hi ${vendor.name}, I am interested in your ${vendor.category} services for my event. Please share availability and pricing details.`;

export async function openVendorPhone(vendor: Vendor) {
  const phone = getPhone(vendor);
  const phoneUrl = `tel:${phone}`;
  const canOpen = await Linking.canOpenURL(phoneUrl);

  if (!canOpen) {
    Alert.alert('Unable to call', 'Calling is not available on this device.');
    return;
  }

  await Linking.openURL(phoneUrl);
}

export async function openVendorEmail(vendor: Vendor) {
  const email = getEmail(vendor);
  const subject = encodeURIComponent(`Event inquiry for ${vendor.name}`);
  const body = encodeURIComponent(buildIntroMessage(vendor));
  const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
  const canOpen = await Linking.canOpenURL(emailUrl);

  if (!canOpen) {
    Alert.alert('Unable to email', 'No email app is configured on this device.');
    return;
  }

  await Linking.openURL(emailUrl);
}

export async function openVendorMessage(vendor: Vendor) {
  const messageText = encodeURIComponent(buildIntroMessage(vendor));
  const whatsappPhone = getWhatsappPhone(vendor).replace('+', '');
  const whatsappUrl = `whatsapp://send?phone=${whatsappPhone}&text=${messageText}`;
  const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);

  if (canOpenWhatsapp) {
    await Linking.openURL(whatsappUrl);
    return;
  }

  const smsPhone = getPhone(vendor);
  const smsUrl = `sms:${smsPhone}?body=${messageText}`;
  const canOpenSms = await Linking.canOpenURL(smsUrl);

  if (canOpenSms) {
    await Linking.openURL(smsUrl);
    return;
  }

  Alert.alert('Message unavailable', 'No supported messaging app was found.');
}
