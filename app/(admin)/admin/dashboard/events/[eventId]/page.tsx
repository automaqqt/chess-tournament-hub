// app/(admin)/admin/dashboard/events/[eventId]/page.tsx

import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RegistrationsTable from "@/components/admin/registrations-table";
import TeamsTable from "@/components/admin/teams-table";

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventRegistrationsPage({ params }: PageProps) {
    const paramses = await params;
  const event = await prisma.event.findUnique({
    where: { id: paramses.eventId },
    include: {
      registrations: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      teams: {
        include: {
          members: {
            select: { id: true, firstName: true, lastName: true, birthYear: true, elo: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Parse custom field headers from the event model
  const customFieldHeaders = event.customFields
    ? event.customFields.split(',').map(f => f.trim()).filter(f => f)
    : [];

  const feeOptions = Array.isArray(event.fees)
    ? (event.fees as { name: string; price: number }[]).filter(f => f.name && f.name.trim() !== '')
    : [];

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Button asChild variant="outline" size="sm" className="mb-4">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-merriweather text-primary">{event.title}</h1>
        <p className="text-muted-foreground">
          {event.isTeamMode ? 'Angemeldete Teams und deren Spieler.' : 'Liste aller angemeldeten Teilnehmer.'}
        </p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle>
            {event.isTeamMode
              ? `Teams (${event.teams.length})`
              : `Registrations (${event.registrations.length})`}
          </CardTitle>
          <CardDescription>
            {event.isTeamMode
              ? 'Übersicht der Teams. Klicke auf das Stift-Symbol, um ein Team zu bearbeiten.'
              : 'Below are the details of everyone who has signed up for this event.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {event.isTeamMode ? (
            event.teams.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>Noch keine Teams für diese Veranstaltung angemeldet.</p>
              </div>
            ) : (
              <TeamsTable
                teams={event.teams}
                eventId={event.id}
                minTeamSize={event.minTeamSize}
                maxTeamSize={event.maxTeamSize}
                feeOptions={feeOptions}
              />
            )
          ) : event.registrations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Noch niemand hat sich für diese Veranstaltung angemeldet.</p>
            </div>
          ) : (
            <RegistrationsTable
              registrations={event.registrations}
              eventId={event.id}
              customFieldHeaders={customFieldHeaders}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}