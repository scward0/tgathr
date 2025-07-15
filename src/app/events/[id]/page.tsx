'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';

interface DashboardPageProps {
  params: {
    id: string;
  };
}

export default function EventDashboard({ params }: DashboardPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set()); // Add this line


  // Fetch event data on component mount
  useEffect(() => {
    async function fetchEventData() {
      try {
        const response = await fetch(`/api/events/${params.id}`);
        if (!response.ok) {
          notFound();
        }
        const eventData = await response.json();
        setData(eventData);
      } catch (error) {
        console.error('Error fetching event data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    fetchEventData();
  }, [params.id]);

  // Handle event finalization
  const handleFinalize = async (startTime: string, endTime: string, participantNames: string[]) => {
    if (!confirm('Are you sure you want to finalize this event? This action cannot be undone.')) {
      return;
    }

    setFinalizing(true);
    
    try {
      const response = await fetch(`/api/events/${params.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalStartDate: startTime,
          finalEndDate: endTime,
          selectedParticipants: participantNames,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to finalize event');
      }

      const result = await response.json();
      console.log('Event finalized:', result);
      
      // Refresh the data to show finalized state
      window.location.reload();
      
    } catch (error) {
      console.error('Error finalizing event:', error);
      alert('Failed to finalize event. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading event data...</div>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { event, participants, stats } = data;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {event.name}
                {event.isFinalized && (
                  <span className="ml-3 text-green-400 text-lg">✅ Finalized</span>
                )}
              </h1>
              <p className="text-gray-400">
                {event.eventType === 'single-day' ? 'Single Day Event' : 'Multi-Day Event'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                {stats.responseRate}%
              </div>
              <div className="text-sm text-gray-400">
                Response Rate
              </div>
            </div>
          </div>
          
          {event.description && (
            <p className="text-gray-300 mt-3">{event.description}</p>
          )}

          {/* Finalized Event Details */}
          {event.isFinalized && event.finalStartDate && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <h3 className="text-green-100 font-semibold mb-2">🎉 Event Confirmed!</h3>
              <div className="text-green-200">
                {event.eventType === 'single-day' 
                  ? `${format(new Date(event.finalStartDate), 'EEEE, MMMM d, yyyy')} at ${format(new Date(event.finalStartDate), 'h:mm a')}`
                  : `${format(new Date(event.finalStartDate), 'MMMM d')} - ${format(new Date(event.finalEndDate), 'MMMM d, yyyy')}`
                }
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">
              {stats.totalParticipants}
            </div>
            <div className="text-sm text-gray-400">Total Invited</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {stats.respondedParticipants}
            </div>
            <div className="text-sm text-gray-400">Responded</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {stats.totalParticipants - stats.respondedParticipants}
            </div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">
              {data.popularTimes && data.popularTimes.length > 0 ? data.popularTimes[0].participantCount : 0}
            </div>
            <div className="text-sm text-gray-400">Best Overlap</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Smart Algorithm Recommendations */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              🧠 Smart Recommendations
            </h2>
            
            {data.smartRecommendations && data.smartRecommendations.length > 0 ? (
              <div className="space-y-4">
                {data.smartRecommendations.slice(0, 3).map((rec: {
                  startTime: string;
                  endTime: string;
                  participantCount: number;
                  participantNames: string[];
                  score: number;
                  reasoning: string;
                  conflictParticipants: string[];
                }, index: number) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      index === 0 
                        ? 'bg-blue-900/30 border-blue-700' 
                        : index === 1
                        ? 'bg-purple-900/30 border-purple-700'
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {index === 0 && '🥇'} 
                          {index === 1 && '🥈'} 
                          {index === 2 && '🥉'}
                          {event.eventType === 'single-day' 
                            ? format(new Date(rec.startTime), 'EEEE, MMM d')
                            : `${format(new Date(rec.startTime), 'MMM d')} - ${format(new Date(rec.endTime), 'MMM d')}`
                          }
                        </div>
                        {event.eventType === 'single-day' && (
                          <div className="text-sm text-gray-300">
                            {format(new Date(rec.startTime), 'h:mm a')} - {format(new Date(rec.endTime), 'h:mm a')}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          Score: {rec.score}
                        </div>
                        <div className="text-sm text-gray-400">
                          {rec.participantCount}/{stats.totalParticipants} people
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-300 mb-2">
                      {rec.reasoning}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-400">Available:</span>
                        {rec.participantNames.map((name: string, nameIndex: number) => (
                          <span 
                            key={nameIndex}
                            className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                      
                      {rec.conflictParticipants.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-400">Conflicts:</span>
                          {rec.conflictParticipants.map((name: string, nameIndex: number) => (
                            <span 
                              key={nameIndex}
                              className="text-xs bg-red-800 text-red-200 px-2 py-1 rounded"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Finalize Button */}
                    {!event.isFinalized && (
                      <div className="pt-3 border-t border-gray-600">
                        <button
                          onClick={() => handleFinalize(rec.startTime, rec.endTime, rec.participantNames)}
                          disabled={finalizing}
                          className={`w-full px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
                            index === 0
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {finalizing ? 'Finalizing...' : index === 0 ? '🏆 Finalize This Time' : 'Select This Time'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>🤖 Algorithm needs more data</p>
                <p className="text-sm mt-1">Get more responses to see smart recommendations</p>
              </div>
            )}
          </div>



          {/* Participant Status - Right Column */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              👥 Participant Status
            </h2>
            
            <div className="space-y-3">
              {participants.map((participant: {
                id: string;
                name: string;
                phoneNumber: string;
                hasResponded: boolean;
                responseCount: number;
                timeSlots?: Array<{
                  startTime: string;
                  endTime: string;
                }>;
              }) => {
                const isExpanded = expandedParticipants.has(participant.id);
                
                const toggleParticipant = (participantId: string) => {
                  const newExpanded = new Set(expandedParticipants);
                  if (newExpanded.has(participantId)) {
                    newExpanded.delete(participantId);
                  } else {
                    newExpanded.add(participantId);
                  }
                  setExpandedParticipants(newExpanded);
                };

                const formatTimeSlot = (startTime: string, endTime: string) => {
                  const start = new Date(startTime);
                  const end = new Date(endTime);
                  
                  if (event.eventType === 'multi-day') {
                    return format(start, 'MMM d, yyyy');
                  } else {
                    return `${format(start, 'MMM d')} • ${format(start, 'h:mm a')}-${format(end, 'h:mm a')}`;
                  }
                };

                return (
                  <div 
                    key={participant.id}
                    className="bg-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Main participant card */}
                    <div 
                      className={`flex items-center justify-between p-3 transition-colors ${
                        participant.hasResponded 
                          ? 'cursor-pointer hover:bg-gray-600' 
                          : 'cursor-default'
                      }`}
                      onClick={() => participant.hasResponded && toggleParticipant(participant.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          participant.hasResponded ? 'bg-green-400' : 'bg-gray-400'
                        }`} />
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {participant.name}
                            {participant.hasResponded && (
                              <span className="text-gray-400 text-sm">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {participant.phoneNumber}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {participant.hasResponded ? (
                          <div>
                            <div className="text-green-400 font-medium">✓ Responded</div>
                            <div className="text-xs text-gray-400">
                              {participant.responseCount} time{participant.responseCount !== 1 ? 's' : ''} selected
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400">Pending</div>
                        )}
                      </div>
                    </div>

                    {/* Expanded time slots */}
                    {isExpanded && participant.timeSlots && participant.timeSlots.length > 0 && (
                      <div className="px-3 pb-3 border-t border-gray-600">
                        <div className="pt-3">
                          <div className="text-xs text-gray-400 mb-2 font-medium">
                            AVAILABLE TIMES:
                          </div>
                          <div className="space-y-1">
                            {participant.timeSlots.map((slot: { startTime: string; endTime: string }, index: number) => (
                              <div 
                                key={index}
                                className="text-sm text-gray-300 bg-gray-800 px-2 py-1 rounded"
                              >
                                {formatTimeSlot(slot.startTime, slot.endTime)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

  

        {/* Event Details */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            📋 Event Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-300">
            <div>
              <span className="font-medium text-gray-400">Availability Window:</span>
              <div>{format(new Date(event.availabilityStartDate), 'MMM d, yyyy')} - {format(new Date(event.availabilityEndDate), 'MMM d, yyyy')}</div>
            </div>
            
            {event.preferredTime && (
              <div>
                <span className="font-medium text-gray-400">Preferred Time:</span>
                <div>{event.preferredTime.replace('-', ' ').toUpperCase()}</div>
              </div>
            )}
            
            {event.duration && (
              <div>
                <span className="font-medium text-gray-400">Duration:</span>
                <div>{event.duration.replace('-', ' ')}</div>
              </div>
            )}
            
            {event.eventLength && (
              <div>
                <span className="font-medium text-gray-400">Event Length:</span>
                <div>{event.eventLength.replace('-', ' ')}</div>
              </div>
            )}
            
            {event.timingPreference && (
              <div>
                <span className="font-medium text-gray-400">Timing Preference:</span>
                <div>{event.timingPreference.replace('-', ' ')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!event.isFinalized && (
          <div className="mt-8 flex gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors">
              📧 Send Reminders
            </button>
            
            <button className="px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors">
              📋 Export Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}