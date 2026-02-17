import EventList from "@/components/events/event-list";
import prisma from "@/lib/db";

export default async function HomePage() {
  const now = new Date();

  // For events without endDate, calculate cutoff time (4 hours ago)
  const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));

  const events = await prisma.event.findMany({
    where: {
      OR: [
        // Events with endDate that haven't ended yet
        {
          endDate: {
            gte: now,
          },
        },
        // Events without endDate where start + 4 hours hasn't passed
        {
          endDate: null,
          date: {
            gte: fourHoursAgo,
          },
        },
      ],
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
    <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12" style={{backgroundColor:'46F527'}}>
      <header className="mb-5 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-merriweather font-bold text-white">Unsere Schachturniere in Magdeburg und Umgebung</h1>
      </header>

      <EventList initialEvents={events} />
    </main>
  );
}