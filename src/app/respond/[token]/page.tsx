import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AvailabilityForm } from '@/components/AvailabilityForm';

interface ResponsePageProps {
  params: {
    token: string;
  };
}

async function getParticipantAndEvent(token: string) {
  try {
    const participant = await prisma.participant.findUnique({
      where: { token },
      include: {
        events: {
          include: {
            creator: true,
          },
        },
      },
    });

    if (!participant || participant.events.length === 0) {
      return null;
    }

    // Get the most recent event for this participant
    const event = participant.events[0];
    
    return { participant, event };
  } catch (error) {
    console.error('Error fetching participant/event:', error);
    return null;
  }
}

export default async function ResponsePage({ params }: ResponsePageProps) {
  const data = await getParticipantAndEvent(params.token);

  if (!data) {
    notFound();
  }

  const { participant, event } = data;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Event Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {event.name}
          </h1>
          <p className="text-gray-300">
            Organized by {event.creator.name}
          </p>
          {event.description && (
            <p className="text-gray-400 mt-2">{event.description}</p>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>
          
          <div className="space-y-3 text-gray-300">
            <div>
              <span className="font-medium">Type:</span>{' '}
              {event.eventType === 'single-day' ? 'Single Day Event' : 'Multi-Day Event'}
            </div>
            
            <div>
              <span className="font-medium">Looking for availability between:</span>{' '}
              {new Date(event.availabilityStartDate).toLocaleDateString()} - {' '}
              {new Date(event.availabilityEndDate).toLocaleDateString()}
            </div>

            {event.preferredTime && (
              <div>
                <span className="font-medium">Preferred time:</span>{' '}
                {event.preferredTime.replace('-', ' ').toUpperCase()}
              </div>
            )}

            {event.duration && (
              <div>
                <span className="font-medium">Duration:</span>{' '}
                {event.duration.replace('-', ' ')}
              </div>
            )}

            {event.eventLength && (
              <div>
                <span className="font-medium">Event length:</span>{' '}
                {event.eventLength.replace('-', ' ')}
              </div>
            )}
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">
            Hi {participant.name}! 👋
          </h2>
          <p className="text-blue-100">
            Please submit your availability below. We'll find the best time that works for everyone!
          </p>
        </div>

        {/* Availability Form Placeholder */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Submit Your Availability
          </h2>
          <div className="text-center py-12 text-gray-400">
            <div className="bg-gray-800 rounded-lg p-6">
            <AvailabilityForm 
                  event={{
                    id: event.id,
                    name: event.name,
                    eventType: event.eventType,
                    availabilityStartDate: event.availabilityStartDate.toISOString(),
                    availabilityEndDate: event.availabilityEndDate.toISOString(),
                    preferredTime: event.preferredTime || undefined,
                    duration: event.duration || undefined,
                    eventLength: event.eventLength || undefined,
                    timingPreference: event.timingPreference || undefined,
                  }}
                  participant={participant} 
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}