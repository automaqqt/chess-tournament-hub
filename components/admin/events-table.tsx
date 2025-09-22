// components/admin/events-table.tsx

'use client'; // This component requires client-side interactivity for the delete button.

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Edit, Trash2, Download, ChevronUp, ChevronDown } from "lucide-react";
import { deleteEvent } from "@/lib/actions";

// Define the type for the event props this component expects
type EventWithCount = {
  id: string;
  title: string;
  date: Date;
  isPremier: boolean;
  _count: {
    registrations: number;
  };
};

type SortField = 'title' | 'date' | 'registrations';
type SortDirection = 'asc' | 'desc';

export default function EventsTable({ events }: { events: EventWithCount[] }) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let aValue: string | Date | number;
      let bValue: string | Date | number;
      
      if (sortField === 'title') {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else if (sortField === 'date') {
        aValue = new Date(a.date);
        bValue = new Date(b.date);
      } else {
        aValue = a._count.registrations;
        bValue = b._count.registrations;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [events, sortField, sortDirection]);

  const handleDelete = async (eventId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Veranstaltung und alle Anmeldungen löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      // We re-validate the path in the server action, so the page will refresh.
      await deleteEvent(eventId); 
    }
  };

  const SortableHeader = ({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-zinc-700/50 select-none ${field === 'title' ? 'w-[30%]' : field === 'date' ? 'w-[20%]' : ''} ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 ${sortField === field && sortDirection === 'asc' ? 'text-primary' : 'text-zinc-500'}`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-primary' : 'text-zinc-500'}`} 
          />
        </div>
      </div>
    </TableHead>
  );

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Veranstaltungen</h2>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800 border-zinc-700">
            <SortableHeader field="title">Veranstaltungstitel</SortableHeader>
            <SortableHeader field="date">Datum</SortableHeader>
            <SortableHeader field="registrations" className="text-center">Anmeldungen</SortableHeader>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEvents.map((event) => (
            <TableRow key={event.id} className="hover:bg-zinc-800 border-zinc-800">
              <TableCell className="font-medium">
                {event.title}{' '}
                {event.isPremier && <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">Intern</Badge>}
              </TableCell>
              <TableCell>
                {new Date(event.date).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell className="text-center">{event._count.registrations}</TableCell>
              
              {/* --- REPLACEMENT: SIMPLE BUTTON ROW --- */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="icon">
                    <Link href={`/admin/dashboard/events/${event.id}`} title="Teilnehmer anzeigen">
                       <span className="sr-only">Teilnehmer anzeigen</span>
                       <Users className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="icon">
                    <Link href={`/admin/dashboard/events/${event.id}/edit`} title="Veranstaltung bearbeiten">
                       <span className="sr-only">Veranstaltung bearbeiten</span>
                       <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="icon">
                    <Link href={`/api/export/${event.id}`} title="CSV exportieren">
                       <span className="sr-only">CSV exportieren</span>
                       <Download className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(event.id)}
                    title="Veranstaltung löschen"
                  >
                    <span className="sr-only">Veranstaltung löschen</span>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}