// app/(admin)/admin/dashboard/events/[eventId]/edit/page.tsx

import EventForm from "@/components/admin/event-form";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-3xl font-merriweather text-primary">Edit Event</CardTitle>
          <CardDescription>Update the details for &quot;{event.title}&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm event={event} />
        </CardContent>
      </Card>
    </div>
  );
}