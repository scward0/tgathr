import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-4xl font-bold tracking-tight mb-8 text-white">tgathr</h1>
      <Link 
        href="/events/new"
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        Create Event
      </Link>
    </main>
  );
}