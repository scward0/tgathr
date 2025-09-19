import { z } from 'zod';

export const eventFormSchema = z.object({
  name: z.string()
    .min(3, 'Event name must be at least 3 characters')
    .max(100, 'Event name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  eventType: z.enum(['single-day', 'multi-day'], {
    required_error: 'Please select an event type',
  }),
  availabilityStartDate: z.date({
    required_error: 'Availability window start is required',
  }),
  availabilityEndDate: z.date({
    required_error: 'Availability window end is required',
  }),
  // Single day event fields - allow empty strings and transform
  preferredTime: z.string().optional().or(z.literal('')),
  duration: z.string().optional().or(z.literal('')),
  // Multi-day event fields - allow empty strings and transform
  eventLength: z.string().optional().or(z.literal('')),
  timingPreference: z.string().optional().or(z.literal('')),
  participants: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      phoneNumber: z.string().optional(),
      email: z.string().email('Please enter a valid email address')
    })
  ).min(1, 'At least one participant is required'),
}).refine((data) => data.availabilityEndDate >= data.availabilityStartDate, {
  message: "End date must be after start date",
  path: ["availabilityEndDate"],
}).refine((data) => {
  // Require single-day specific fields when single-day is selected
  if (data.eventType === 'single-day') {
    return data.preferredTime && data.preferredTime !== '' && data.duration && data.duration !== '';
  }
  return true;
}, {
  message: "Please select preferred time and duration for single-day events",
  path: ["preferredTime"],
}).refine((data) => {
  // Require multi-day specific fields when multi-day is selected
  if (data.eventType === 'multi-day') {
    return data.eventLength && data.eventLength !== '' && data.timingPreference && data.timingPreference !== '';
  }
  return true;
}, {
  message: "Please select event length and timing preference for multi-day events",
  path: ["eventLength"],
});

export type EventFormData = z.infer<typeof eventFormSchema>;

// Add this new type for the API response
export type CreatedEvent = {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  availabilityStartDate: Date;
  availabilityEndDate: Date;
  preferredTime?: string;
  duration?: string;
  eventLength?: string;
  timingPreference?: string;
  creator: {
    id: string;
    name: string;
    token: string;
  };
  participants: {
    id: string;
    name: string;
    token: string;
  }[];
};