// app/(admin)/admin/dashboard/page.tsx

import prisma from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, PlusCircle } from "lucide-react";
import { logout } from "@/lib/auth";
import EventsTable from "@/components/admin/events-table"; // <-- IMPORT THE NEW COMPONENT

export default async function AdminDashboard() {
  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold font-merriweather text-primary">Admin-Dashboard</h1>
            <p className="text-muted-foreground">Veranstaltungen verwalten und Anmeldungen anzeigen.</p>
        </div>
        <div className="flex gap-2">
             <Button asChild variant="outline">
                <Link href="/admin/dashboard/new-event">
                    <PlusCircle className="mr-2 h-4 w-4" /> Neue Veranstaltung erstellen
                </Link>
             </Button>
             <form action={async () => { 'use server'; await logout(); }}>
                 <Button variant="outline">
                    <LogOut className="mr-2 h-4 w-4" /> Abmelden
                 </Button>
             </form>
        </div>
      </div>

      {/* RENDER THE CLIENT COMPONENT AND PASS DATA AS PROPS */}
      <EventsTable events={events} />

    </div>
  );
}