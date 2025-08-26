
import EventForm from "@/components/admin/event-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewEventPage() {
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
          <CardTitle className="text-3xl font-merriweather text-primary">Neue Veranstaltung erstellen</CardTitle>
          <CardDescription>Füllen Sie das Formular aus, um ein neues Turnier hinzuzufügen.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>
    </div>
  );
}