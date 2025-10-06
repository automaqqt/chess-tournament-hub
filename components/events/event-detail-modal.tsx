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
import React from 'react';

export default function EventDetailsModal({ event, children }: { event: Event; children: React.ReactNode }) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() - 1);
    const isRegistrationOpen = tomorrow < new Date(event.registrationEndDate);
    const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    const fees = Array.isArray(event.fees) ? event.fees : [];
    const registrationEndDate = new Date(event.registrationEndDate).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            
            {/* --- 1. THE DIALOG CONTENT IS NOW THE GRID CONTAINER --- */}
            <DialogContent className="sm:max-w-4xl lg:max-w-5xl bg-zinc-900/95 border-zinc-800 backdrop-blur-xl text-white grid grid-rows-[auto_1fr_auto] max-h-[90vh] p-0 shadow-2xl">

                {/* --- 2. HEADER: NO CHANGE, BUT NOW A GRID ROW --- */}
                <DialogHeader className="p-8 pb-4 border-b border-zinc-800/50">
                    <DialogTitle className="text-4xl font-merriweather text-primary mb-2">{event.title}</DialogTitle>
                    <DialogDescription className="text-text-light text-base">
                        {new Date(event.date).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </DialogDescription>
                </DialogHeader>

                {/* --- 3. SCROLLABLE CONTENT AREA --- */}
                <div className="overflow-y-auto px-8">
                    <div className="grid gap-8 py-6">
                        <div className="modal-section">
                            <h4 className="text-xl font-semibold mb-4 border-l-4 border-primary pl-4 text-white">Details</h4>
                            <div
                                className="text-text-light pl-5 prose prose-sm prose-invert max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: event.fullDetails }}
                            />
                        </div>

                        <div className="modal-section bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
                            <h4 className="text-xl font-semibold mb-4 border-l-4 border-primary pl-4 text-white">Anmeldung</h4>
                            <div className="pl-5 space-y-3">
                                <p className="text-text-light text-base">
                                    <span className="font-semibold text-white">Anmeldeschluss:</span> {registrationEndDate}
                                </p>
                                <p className={`text-sm font-medium px-3 py-2 rounded-md inline-block ${isRegistrationOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                    {isRegistrationOpen ? '✓ Anmeldung ist geöffnet' : '✗ Anmeldung ist geschlossen'}
                                </p>
                            </div>
                        </div>

                        <div className="modal-section">
                            <h4 className="text-xl font-semibold mb-4 border-l-4 border-primary pl-4 text-white">Preise & Startgeld</h4>
                            {fees.length > 0 ? (
                                <ul className="list-none text-text-light pl-5 space-y-3">
                                    {(fees as { name: string; price: number }[]).map((fee) => (
                                        <li key={fee.name} className="flex items-center gap-3 text-base bg-zinc-800/20 px-4 py-3 rounded-md border border-zinc-700/30">
                                            <span className="text-primary text-xl">♙</span>
                                            <span className="font-medium text-white">{fee.name}:</span>
                                            <span className="text-primary font-semibold">{fee.price}€</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="pl-5">
                                    <p className="flex items-center gap-3 text-green-400 font-semibold text-base bg-green-500/10 px-4 py-3 rounded-md border border-green-500/30">
                                        <span className="text-primary text-xl">♙</span> Frei für Alle
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="modal-section">
                            <h4 className="text-xl font-semibold mb-4 border-l-4 border-primary pl-4 text-white">Ort</h4>
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-zinc-700/50 shadow-lg">
                                <iframe src={mapEmbedSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Event Location" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 4. FOOTER: NO CHANGE, BUT NOW A GRID ROW --- */}
                <DialogFooter className="flex-col sm:flex-row gap-3 p-8 pt-6 border-t border-zinc-800/50 bg-zinc-900/50">
                    {event.pdfUrl && (
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                            <a href={event.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" /> Ausschreibung
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