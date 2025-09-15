// components/admin/events-table.tsx

'use client'; // This component requires client-side interactivity for the delete button.

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
import { Users, Edit, Trash2, Download } from "lucide-react";
import { deleteEvent } from "@/lib/actions";

// Define the type for the event props this component expects
type EventWithCount = {
  id: string;
  title: string;
  isPremier: boolean;
  _count: {
    registrations: number;
  };
};

export default function EventsTable({ events }: { events: EventWithCount[] }) {
  const handleDelete = async (eventId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Veranstaltung und alle Anmeldungen löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      // We re-validate the path in the server action, so the page will refresh.
      await deleteEvent(eventId); 
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Veranstaltungen</h2>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-zinc-800 border-zinc-700">
            <TableHead className="w-[40%]">Veranstaltungstitel</TableHead>
            <TableHead className="text-center">Anmeldungen</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="hover:bg-zinc-800 border-zinc-800">
              <TableCell className="font-medium">
                {event.title}{' '}
                {event.isPremier && <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">Intern</Badge>}
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
                    variant="destructive"
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