import EventList from "@/components/events/event-list";
import prisma from "@/lib/db";

export default async function HomePage() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() - 1);
  const events = await prisma.event.findMany({
    where: {
      // --- ADD THIS FILTER ---
      registrationEndDate: {
        gte: tomorrow, // "greater than or equal to" today
      },
    },
    include: {
      _count: {
        select: {
          registrations: true
        }
      }
    },
    orderBy: { date: 'asc' }
  });

  return (
    <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12" style={{backgroundColor:'46F527'}}>
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-merriweather font-bold text-white">Unsere Schachturniere in Magdeburg und Umgebung</h1>
      </header>

      <EventList initialEvents={events} />
    </main>
  );
}