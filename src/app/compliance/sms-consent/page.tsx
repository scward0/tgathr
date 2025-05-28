import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SMS Consent & Opt-In Information | TgatHR',
  description: 'Learn about how TgatHR handles SMS communications and user consent.',
};

export default function SMSConsentPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">SMS Consent & Opt-In Information</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How We Use SMS</h2>
        <p className="mb-4">
          tgathr uses SMS (text messages) to help coordinate events and meetings. We only send SMS messages to users who have been explicitly invited to participate in an event.
        </p>
        <p className="mb-4">
          Our SMS messages are strictly transactional and are used to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Send event invitations with availability submission links</li>
          <li>Send event confirmations once a time has been selected</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Opt-In Process</h2>
        <p className="mb-4">
          Users opt into receiving SMS messages when they are invited to an event. The opt-in process works as follows:
        </p>
        <ol className="list-decimal pl-6 mb-4">
          <li>An event creator invites participants by providing their phone numbers</li>
          <li>Participants receive an SMS invitation with a link to submit their availability</li>
          <li>By responding to the invitation, participants consent to receive SMS messages related to that specific event</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Message Frequency</h2>
        <p className="mb-4">
          We send a limited number of SMS messages per event:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>One initial invitation message with the availability submission link</li>
          <li>One confirmation message when the event time is finalized</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Opt-Out Information</h2>
        <p className="mb-4">
          Users can opt out of receiving SMS messages at any time by:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Replying "STOP" to any SMS message</li>
          <li>Contacting the event creator to remove them from the event</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Privacy & Data Protection</h2>
        <p className="mb-4">
          We take your privacy seriously. Your phone number is only used for event-related communications and is never shared with third parties except as required by law or with your explicit consent.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
        <p className="mb-4">
          If you have any questions about our SMS practices or need assistance, please contact us at:
        </p>
        <p className="mb-4">
          Email: support@tgathr.com
        </p>
      </section>

      <section className="text-sm text-gray-600">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </section>
    </div>
  );
} 