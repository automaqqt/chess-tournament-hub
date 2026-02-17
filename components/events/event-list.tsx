'use client';

import { useState, useMemo } from 'react';
import type { Event } from '@prisma/client';

type EventWithCount = Event & {
  _count: {
    registrations: number;
  };
};
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EventCard from './event-card';
import { Search } from 'lucide-react';

type FilterType = 'all' | 'Einsteiger' | 'Fortgeschritten' | 'Wettkampf Schach';

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'Einsteiger', label: 'Einsteiger' },
  { value: 'Fortgeschritten', label: 'Fortgeschritten' },
  { value: 'Wettkampf Schach', label: 'Wettkampf Schach' },
];

export default function EventList({ initialEvents }: { initialEvents: EventWithCount[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredEvents = useMemo(() => {
    return initialEvents
      .filter(event => {
        if (activeFilter === 'all') return true;
        return event.type === activeFilter;
      })
      .filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [initialEvents, searchTerm, activeFilter]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center mb-6 sm:mb-12">
        <div className="relative w-full md:flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Nach Name, Ort suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 py-3 bg-zinc-900/50 border-zinc-700 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap gap-2">
          {filters.map(({ value, label }) => (
            <Button
              key={value}
              variant="outline"
              onClick={() => setActiveFilter(value)}
              className={`rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base border-zinc-700 transition-all duration-300 ${
                activeFilter === value
                  ? 'bg-zinc-500 text-white border-zinc-500 hover:bg-zinc-500/90'
                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
              }`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-10">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="col-span-full text-center py-16 px-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
          <h3 className="text-2xl font-semibold text-white">Keine Turniere gefunden</h3>
          <p className="mt-2 text-text-light">Versuchen Sie, Ihre Suche oder Filter anzupassen.</p>
        </div>
      )}
    </>
  );
}