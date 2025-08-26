'use client';

import type { Event } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';
import Image from 'next/image';
import EventDetailsModal from './event-detail-modal';

const PremierStamp = () => (
  <div className="premier-stamp">
    <Image src="/logo.png" alt="Premier Event" width={48} height={48} className="object-contain" />
  </div>
);

export default function EventCard({ event }: { event: Event }) {
  return (
    <Card className="relative bg-black/30 border-zinc-800 shadow-lg shadow-black/30 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-primary hover:-translate-y-2">
      {event.isPremier && <PremierStamp />}
      <CardHeader>
        <CardTitle className="text-2xl font-merriweather text-primary">{event.title}</CardTitle>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary/70" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary/70" />
            <span>{event.location}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <CardDescription className="flex-grow mb-6">{event.description}</CardDescription>
        <EventDetailsModal event={event}>
          <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Details ansehen & Anmelden
          </Button>
        </EventDetailsModal>
      </CardContent>
    </Card>
  );
}