// components/events/event-details-modal.tsx

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Event } from '@prisma/client';
import { Button } from '@/components/ui/button';
import RegistrationModal from './event-registration-modal';
import { Download } from 'lucide-react';

export default function EventDetailsModal({ event, children }: { event: Event; children: React.ReactNode }) {
    const isRegistrationOpen = new Date() < new Date(event.registrationEndDate);
    const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    const fees = Array.isArray(event.fees) ? event.fees : [];
    const registrationEndDate = new Date(event.registrationEndDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            
            {/* --- 1. THE DIALOG CONTENT IS NOW THE GRID CONTAINER --- */}
            <DialogContent className="sm:max-w-2xl bg-zinc-900/80 border-zinc-800 backdrop-blur-lg text-white grid grid-rows-[auto_1fr_auto] max-h-[90vh] p-0">
                
                {/* --- 2. HEADER: NO CHANGE, BUT NOW A GRID ROW --- */}
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-3xl font-merriweather text-primary">{event.title}</DialogTitle>
                    <DialogDescription className="text-text-light pt-2">
                        {event.location} &bull; {event.date}
                    </DialogDescription>
                </DialogHeader>

                {/* --- 3. SCROLLABLE CONTENT AREA --- */}
                <div className="overflow-y-auto px-6">
                    <div className="grid gap-6 py-4">
                        <div className="modal-section">
                            <h4 className="text-lg font-semibold mb-2 border-l-2 border-primary pl-3">Details</h4>
                            <p className="text-text-light pl-4">{event.fullDetails}</p>
                        </div>

                        <div className="modal-section">
                            <h4 className="text-lg font-semibold mb-2 border-l-2 border-primary pl-3">Anmeldung</h4>
                            <div className="pl-4">
                                <p className="text-text-light">
                                    <span className="font-medium">Anmeldeschluss:</span> {registrationEndDate}
                                </p>
                                <p className={`text-sm mt-1 ${isRegistrationOpen ? 'text-green-400' : 'text-red-400'}`}>
                                    {isRegistrationOpen ? '✓ Anmeldung ist geöffnet' : '✗ Anmeldung ist geschlossen'}
                                </p>
                            </div>
                        </div>

                        {fees.length > 0 && (
                            <div className="modal-section">
                                <h4 className="text-lg font-semibold mb-2 border-l-2 border-primary pl-3">Preise & Startgeld</h4>
                                <ul className="list-none text-text-light pl-4 space-y-1">
                                    {fees.map((fee: { name: string; price: number }) => (
                                        <li key={fee.name} className="flex items-center gap-3">
                                            <span className="text-primary">♙</span> {fee.name}: ${fee.price}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="modal-section">
                            <h4 className="text-lg font-semibold mb-3 border-l-2 border-primary pl-3">Ort</h4>
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-700">
                                <iframe src={mapEmbedSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Event Location" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 4. FOOTER: NO CHANGE, BUT NOW A GRID ROW --- */}
                <DialogFooter className="flex-col sm:flex-row gap-2 p-6 pt-4 border-t border-zinc-800">
                    {event.pdfUrl && (
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                            <a href={event.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Flyer herunterladen
                            </a>
                        </Button>
                    )}
                    {isRegistrationOpen ? (
                        <RegistrationModal event={event}>
                            <Button variant="outline" type="submit" className="w-full sm:w-auto">Jetzt anmelden</Button>
                        </RegistrationModal>
                    ) : (
                        <Button variant="outline" disabled className="w-full sm:w-auto">Anmeldung geschlossen</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}