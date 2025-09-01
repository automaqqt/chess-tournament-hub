'use client';

import type { Event } from '@prisma/client';

type EventWithCount = Event & {
  _count: {
    registrations: number;
  };
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import EventDetailsModal from './event-detail-modal';

const PremierStamp = () => (
  <div className="premier-stamp">
    <Image src="/logo.png" alt="Premier Event" width={48} height={48} className="object-contain" />
  </div>
);

export default function EventCard({ event }: { event: EventWithCount }) {
  return (
    <Card className="relative bg-gradient-to-br from-zinc-900/90 via-zinc-800/80 to-zinc-900/90 border-zinc-700/50 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-500 hover:border-primary/60 hover:-translate-y-3 hover:shadow-primary/20 hover:shadow-2xl group">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-br from-white via-transparent to-white"></div>
      
      {event.isPremier && <PremierStamp />}
      <CardHeader className="relative z-10">
        <CardTitle className="text-2xl font-merriweather text-primary group-hover:text-primary/90 transition-colors duration-300">{event.title}</CardTitle>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground mt-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
              <Calendar className="h-3 w-3 text-primary" />
            </div>
            <span className="group-hover:text-gray-200 transition-colors duration-300">
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
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
              <MapPin className="h-3 w-3 text-primary" />
            </div>
            <span className="group-hover:text-gray-200 transition-colors duration-300">{event.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors duration-300">
              <Users className="h-3 w-3 text-green-500" />
            </div>
            <span className="group-hover:text-gray-200 transition-colors duration-300">
              {event._count.registrations} Anmeldung{event._count.registrations !== 1 ? 'en' : ''}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow relative z-10">
        <CardDescription className="flex-grow mb-6 text-gray-300 group-hover:text-gray-200 transition-colors duration-300 leading-relaxed">{event.description}</CardDescription>
        
        {/* Decorative line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-4"></div>
        
        <EventDetailsModal event={event}>
          <Button variant="outline" className="w-full border-primary/60 text-primary bg-primary/5 hover:bg-primary hover:text-black hover:border-primary hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-medium group-hover:border-primary/80">
            <span className="flex items-center justify-center gap-2">
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