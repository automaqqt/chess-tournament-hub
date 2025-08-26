// app/(admin)/admin/dashboard/events/[eventId]/edit/page.tsx

import EventForm from "@/components/admin/event-form";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EditEventPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Dashboard
          </Link>
        </Button>
      </div>
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-3xl font-merriweather text-primary">Veranstaltung bearbeiten</CardTitle>
          <CardDescription>Details für &quot;{event.title}&quot; aktualisieren.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm event={event} />
        </CardContent>
      </Card>
    </div>
  );
}