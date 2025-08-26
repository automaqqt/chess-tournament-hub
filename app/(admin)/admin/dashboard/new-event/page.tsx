
import EventForm from "@/components/admin/event-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewEventPage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-3xl font-merriweather text-primary">Create New Event</CardTitle>
          <CardDescription>Fill out the form below to add a new tournament to the hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>
    </div>
  );
}