'use client';

import type { Event } from '@prisma/client';

type EventWithCount = Event & {
  _count: {
    registrations: number;
  };
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import Image from 'next/image';
import EventDetailsModal from './event-detail-modal';
import RegistrationListModal from './registration-list-modal';

const PremierStamp = () => (
  <div className="absolute top-5 right-5 z-20 opacity-95 hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
    <Image src="/patty.png" alt="Premier Event" width={70} height={70} className="object-contain" />
  </div>
);

export default function EventCard({ event }: { event: EventWithCount }) {
  return (
    <Card className="relative bg-gradient-to-br from-zinc-900/95 via-zinc-800/90 to-zinc-900/95 border border-zinc-700/50 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-500 hover:border-primary/60 hover:-translate-y-2 hover:shadow-primary/20 hover:shadow-2xl group">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 group-hover:h-1.5 transition-all duration-300"></div>

      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-br from-white via-transparent to-white"></div>

      {event.isPremier && <PremierStamp />}

      {/* Header with Title */}
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className={`text-2xl font-merriweather text-primary group-hover:text-primary/90 transition-colors duration-300 leading-tight ${event.isPremier ? 'pr-20' : ''}`}>
          {event.title}
        </CardTitle>
      </CardHeader>

      {/* Metadata Section */}
      <div className="relative z-10 px-6 pb-5">
        <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/30 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-7 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <Calendar className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300 font-medium">
                {new Date(event.date).toLocaleDateString('de-DE', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <MapPin className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300">{event.location}</span>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-600/50 to-transparent my-1"></div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors duration-300">
                <Users className="h-3.5 w-3.5 text-green-400" />
              </div>
              <RegistrationListModal eventId={event.id} registrationCount={event._count.registrations}>
                <span className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300 cursor-pointer hover:text-primary hover:underline underline-offset-2 decoration-primary/50 hover:decoration-primary transition-all duration-200">
                  {event._count.registrations} Anmeldung{event._count.registrations !== 1 ? 'en' : ''}
                </span>
              </RegistrationListModal>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors duration-300">
                <Clock className="h-3.5 w-3.5 text-orange-400" />
              </div>
              <span className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300">
                Anmeldung bis: {new Date(event.registrationEndDate).toLocaleDateString('de-DE', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="flex flex-col flex-grow relative z-10 pt-0">
        <CardDescription className="flex-grow mb-6 text-gray-300 group-hover:text-gray-200 transition-colors duration-300 leading-relaxed text-base">
          {event.description}
        </CardDescription>

        {/* Decorative line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-5"></div>

        <EventDetailsModal event={event}>
          <Button variant="outline" className="w-full border-primary/60 text-primary bg-primary/5 hover:bg-primary hover:text-black hover:border-primary hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-medium group-hover:border-primary/80 py-5">
            <span className="flex items-center justify-center gap-2 text-base">
              Details ansehen & Anmelden
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-black/20 transition-colors duration-300">
                <div className="w-1 h-1 bg-primary rounded-full group-hover:bg-black transition-colors duration-300"></div>
              </div>
            </span>
          </Button>
        </EventDetailsModal>
      </CardContent>
    </Card>
  );
}