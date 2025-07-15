import Link from 'next/link';
import { EventForm } from '@/components/EventForm';

export default function NewEventPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="flex justify-between items-center p-6 border-b border-gray-800">
        <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
          tgathr
        </Link>
        <Link 
          href="/"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </nav>
      
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