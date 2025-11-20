import { EventForm } from '@/components/EventForm';
import { Navigation } from '@/components/Navigation';

export default function NewEventPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-8 px-4">
            Create New Event
          </h1>
          <EventForm />
        </div>
      </div>
    </div>
  );
}