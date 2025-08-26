// app/(admin)/admin/dashboard/events/[eventId]/page.tsx

import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    },
  });

  if (!event) {
    notFound();
  }

  // Parse custom field headers from the event model
  const customFieldHeaders = event.customFields 
    ? event.customFields.split(',').map(f => f.trim()).filter(f => f) 
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
        <p className="text-muted-foreground">Liste aller angemeldeten Teilnehmer.</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle>Registrations ({event.registrations.length})</CardTitle>
          <CardDescription>
            Below are the details of everyone who has signed up for this event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {event.registrations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Noch niemand hat sich für diese Veranstaltung angemeldet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Geburtsjahr</TableHead>
                    <TableHead>Verein</TableHead>
                    <TableHead>ELO</TableHead>
                    {/* Dynamically add headers for custom fields */}
                    {customFieldHeaders.map(header => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.registrations.map((reg, index) => (
                    <TableRow key={reg.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{reg.firstName} {reg.lastName}</TableCell>
                      <TableCell>{reg.email}</TableCell>
                      <TableCell>{reg.birthYear}</TableCell>
                      <TableCell>{reg.verein}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{reg.elo}</Badge>
                      </TableCell>
                      {/* Dynamically add cells for custom field data */}
                      {customFieldHeaders.map(header => (
                        <TableCell key={header}>
                          {String((reg.additionalInfo as Record<string, unknown>)?.[header] || 'N/A')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}