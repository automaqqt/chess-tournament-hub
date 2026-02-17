
import EventForm from "@/components/admin/event-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/db";

type PageProps = {
  searchParams: Promise<{
    duplicateFrom?: string;
  }>;
};

export default async function NewEventPage({ searchParams }: PageProps) {
  const { duplicateFrom } = await searchParams;

  // If duplicating from an existing event, fetch its data
  let defaultValues = undefined;
  if (duplicateFrom) {
    const sourceEvent = await prisma.event.findUnique({
      where: { id: duplicateFrom },
    });

    if (sourceEvent) {
      // Copy all fields except id, dates, and timestamps
      defaultValues = {
        title: sourceEvent.title,
        description: sourceEvent.description,
        fullDetails: sourceEvent.fullDetails,
        location: sourceEvent.location,
        fees: sourceEvent.fees,
        type: sourceEvent.type,
        isPremier: sourceEvent.isPremier,
        isEloRequired: sourceEvent.isEloRequired,
        customFields: sourceEvent.customFields,
        emailText: sourceEvent.emailText,
        organiserEmail: sourceEvent.organiserEmail,
        pdfUrl: sourceEvent.pdfUrl,
      };
    }
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
          <CardTitle className="text-3xl font-merriweather text-primary">
            {duplicateFrom ? 'Veranstaltung duplizieren' : 'Neue Veranstaltung erstellen'}
          </CardTitle>
          <CardDescription>
            {duplicateFrom
              ? 'Die Daten wurden aus der Vorlage übernommen. Bitte passen Sie die Daten an und setzen Sie neue Termine.'
              : 'Füllen Sie das Formular aus, um ein neues Turnier hinzuzufügen.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  );
}
