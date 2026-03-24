import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Review, UserEvent, Vendor, VendorBooking } from '@/types';
import { EVENTS } from '@/constants/events';
import { VENDORS } from '@/constants/vendors';
import { backendService } from '@/services/backend';

export const [EventProvider, useEvents] = createContextHook(() => {
  const [events, setEvents] = useState<Event[]>(EVENTS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>(VENDORS);
  const [vendorBookings, setVendorBookings] = useState<VendorBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEventData();
  }, []);

  const loadEventData = async () => {
    try {
      const remote = await backendService.loadEventState();
      const storedEvents = await AsyncStorage.getItem('event_catalog');
      const storedVendors = await AsyncStorage.getItem('vendor_catalog');

      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents) as Event[];
        if (Array.isArray(parsedEvents)) {
          const storedIds = new Set(
            parsedEvents
              .map(event => event?.id)
              .filter((id): id is string => typeof id === 'string' && id.length > 0)
          );
          const mergedEvents = [
            ...parsedEvents,
            ...EVENTS.filter(defaultEvent => !storedIds.has(defaultEvent.id)),
          ];
          setEvents(mergedEvents);

          if (mergedEvents.length !== parsedEvents.length) {
            await AsyncStorage.setItem('event_catalog', JSON.stringify(mergedEvents));
          }
        }
      }

      if (storedVendors) {
        const parsedVendors = JSON.parse(storedVendors) as Vendor[];
        if (Array.isArray(parsedVendors)) {
          setVendors(parsedVendors);
        }
      }

      if (remote) {
        setReviews(remote.reviews || []);
        setUserEvents(remote.userEvents || []);
        setVendorBookings(remote.vendorBookings || []);
      } else {
        const [storedReviews, storedUserEvents, storedVendorBookings] = await Promise.all([
          AsyncStorage.getItem('event_reviews'),
          AsyncStorage.getItem('user_events'),
          AsyncStorage.getItem('vendor_bookings'),
        ]);

        if (storedReviews) setReviews(JSON.parse(storedReviews));
        if (storedUserEvents) setUserEvents(JSON.parse(storedUserEvents));
        if (storedVendorBookings) setVendorBookings(JSON.parse(storedVendorBookings));
      }
    } catch (error) {
      console.log('Error loading event data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistEvents = async (nextEvents: Event[]) => {
    try {
      await AsyncStorage.setItem('event_catalog', JSON.stringify(nextEvents));
    } catch (error) {
      console.log('Error saving event catalog:', error);
    }
  };

  const persistVendors = async (nextVendors: Vendor[]) => {
    try {
      await AsyncStorage.setItem('vendor_catalog', JSON.stringify(nextVendors));
    } catch (error) {
      console.log('Error saving vendor catalog:', error);
    }
  };

  const persistAll = async (payload: {
    nextReviews?: Review[];
    nextUserEvents?: UserEvent[];
    nextVendorBookings?: VendorBooking[];
  }) => {
    const nextReviews = payload.nextReviews ?? reviews;
    const nextUserEvents = payload.nextUserEvents ?? userEvents;
    const nextVendorBookings = payload.nextVendorBookings ?? vendorBookings;

    try {
      await Promise.all([
        AsyncStorage.setItem('event_reviews', JSON.stringify(nextReviews)),
        AsyncStorage.setItem('user_events', JSON.stringify(nextUserEvents)),
        AsyncStorage.setItem('vendor_bookings', JSON.stringify(nextVendorBookings)),
      ]);
    } catch (error) {
      console.log('Error saving event data:', error);
    }

    backendService.saveEventState({
      reviews: nextReviews,
      userEvents: nextUserEvents,
      vendorBookings: nextVendorBookings,
    });
  };

  const getEventById = (id: string) => events.find(e => e.id === id);
  const getEventsByCategory = (category: string) => events.filter(e => e.category === category);
  const getReviewsByEvent = (eventId: string) => reviews.filter(r => r.eventId === eventId);
  const getVendorById = (id: string) => vendors.find(v => v.id === id);

  const addReview = (review: Review) => {
    setReviews(prev => {
      const next = [review, ...prev];
      persistAll({ nextReviews: next });
      return next;
    });
  };

  const addUserEvent = (userEvent: UserEvent) => {
    setUserEvents(prev => {
      const next = [userEvent, ...prev];
      persistAll({ nextUserEvents: next });
      return next;
    });
  };

  const updateUserEvent = (id: string, updates: Partial<UserEvent>) => {
    setUserEvents(prev => {
      const next = prev.map(e => (e.id === id ? { ...e, ...updates } : e));
      persistAll({ nextUserEvents: next });
      return next;
    });
  };

  const bulkUpdateUserEvents = (ids: string[], updates: Partial<UserEvent>) => {
    if (!ids.length) return;
    setUserEvents(prev => {
      const idSet = new Set(ids);
      const next = prev.map(event =>
        idSet.has(event.id) ? { ...event, ...updates } : event
      );
      persistAll({ nextUserEvents: next });
      return next;
    });
  };

  const cancelUserEvent = (id: string) => {
    setUserEvents(prev => {
      const next = prev.map(e =>
        e.id === id ? { ...e, status: 'cancelled' as const } : e
      );
      persistAll({ nextUserEvents: next });
      return next;
    });
  };

  const addVendorBooking = (booking: VendorBooking) => {
    setVendorBookings(prev => {
      const next = [booking, ...prev];
      persistAll({ nextVendorBookings: next });
      return next;
    });
  };

  const addEvent = (event: Event) => {
    setEvents(prev => {
      const next = [event, ...prev];
      persistEvents(next);
      return next;
    });
  };

  const addVendor = (vendor: Vendor) => {
    setVendors(prev => {
      const next = [vendor, ...prev];
      persistVendors(next);
      return next;
    });
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(prev => {
      let updatedEvent: Event | null = null;
      const next = prev.map(event => {
        if (event.id !== id) return event;
        updatedEvent = { ...event, ...updates };
        return updatedEvent;
      });

      if (updatedEvent) {
        setUserEvents(prevUserEvents => {
          const nextUserEvents = prevUserEvents.map(userEvent =>
            userEvent.eventId === id ? { ...userEvent, event: updatedEvent as Event } : userEvent
          );
          persistAll({ nextUserEvents });
          return nextUserEvents;
        });
      }

      persistEvents(next);
      return next;
    });
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors(prev => {
      const next = prev.map(vendor => (vendor.id === id ? { ...vendor, ...updates } : vendor));
      persistVendors(next);
      return next;
    });
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => {
      const next = prev.filter(event => event.id !== id);
      persistEvents(next);
      return next;
    });
  };

  const deleteVendor = (id: string) => {
    setVendors(prev => {
      const next = prev.filter(vendor => vendor.id !== id);
      persistVendors(next);
      return next;
    });
  };

  const updateVendorBookingStatus = (id: string, status: VendorBooking['status']) => {
    setVendorBookings(prev => {
      const next = prev.map(v => (v.id === id ? { ...v, status } : v));
      persistAll({ nextVendorBookings: next });
      return next;
    });
  };

  const getUserEventsByStatus = (status: UserEvent['status']) =>
    userEvents.filter(e => e.status === status);

  return {
    isLoading,
    events,
    reviews,
    userEvents,
    vendors,
    vendorBookings,
    getEventById,
    getEventsByCategory,
    getReviewsByEvent,
    getVendorById,
    addReview,
    addEvent,
    updateEvent,
    deleteEvent,
    addVendor,
    updateVendor,
    deleteVendor,
    addUserEvent,
    updateUserEvent,
    bulkUpdateUserEvents,
    cancelUserEvent,
    addVendorBooking,
    updateVendorBookingStatus,
    getUserEventsByStatus,
  };
});
