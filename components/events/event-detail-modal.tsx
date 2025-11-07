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
            <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-5xl bg-zinc-900/95 border-zinc-800 backdrop-blur-xl text-white grid grid-rows-[1fr_auto] max-h-[90vh] p-0 shadow-2xl">

                {/* --- 2. SCROLLABLE CONTENT AREA WITH HEADER --- */}
                <div className="overflow-y-auto overflow-x-hidden">
                    <div className="relative px-4 sm:px-8 pt-6 sm:pt-8 pb-6">
                        {/* Background decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>

                        {/* Event header */}
                        <div className="mb-8">
                            <DialogTitle className="text-3xl sm:text-4xl lg:text-5xl font-merriweather text-white mb-4 break-words leading-tight">
                                {event.title}
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 font-medium" suppressHydrationWarning>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(event.date).toLocaleDateString('de-DE', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800/70 text-gray-300 rounded-lg border border-zinc-700/50" suppressHydrationWarning>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(event.date).toLocaleTimeString('de-DE', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} Uhr
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 sm:px-8">
                        <div className="grid gap-8 pb-6">
                        <div className="modal-section">
                            <h4 className="text-xl font-semibold mb-4 border-l-4 border-primary pl-4 text-white break-words">Details</h4>
                            <div
                                className="text-text-light pl-5 prose prose-sm prose-invert max-w-none leading-relaxed break-words [&_*]:break-words"
                                dangerouslySetInnerHTML={{ __html: event.fullDetails }}
                            />
                        </div>

                        <div className="modal-section bg-zinc-800/30 rounded-lg p-6 border border-zinc-700/50">
                            <h4 className="text-xl font-semibold mb-4 border-l-4 border-primary pl-4 text-white break-words">Anmeldung</h4>
                            <div className="pl-5 space-y-3">
                                <p className="text-text-light text-base break-words" suppressHydrationWarning>
                                    <span className="font-semibold text-white">Anmeldeschluss:</span> {registrationEndDate}
                                </p>
                                <p className={`text-sm font-medium px-3 py-2 rounded-md inline-block ${isRegistrationOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                    {isRegistrationOpen ? '✓ Anmeldung ist geöffnet' : '✗ Anmeldung ist geschlossen'}
                                </p>
                            </div>
                        </div>

                        <div className="modal-section">
                            <h4 className="text-xl font-semibold mb-4 border-l-4 border-primary pl-4 text-white break-words">Preise & Startgeld</h4>
                            {fees.length > 0 ? (
                                <ul className="list-none text-text-light pl-5 space-y-3">
                                    {(fees as { name: string; price: number }[]).map((fee) => (
                                        <li key={fee.name} className="flex items-center gap-3 text-base bg-zinc-800/20 px-4 py-3 rounded-md border border-zinc-700/30 break-words">
                                            <span className="text-primary text-xl shrink-0">♙</span>
                                            <span className="font-medium text-white break-words">{fee.name}:</span>
                                            <span className="text-primary font-semibold shrink-0">{fee.price}€</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="pl-5">
                                    <p className="flex items-center gap-3 text-green-400 font-semibold text-base bg-green-500/10 px-4 py-3 rounded-md border border-green-500/30 break-words">
                                        <span className="text-primary text-xl">♙</span> Frei für Alle
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="modal-section">
                            <h4 className="text-xl font-semibold mb-4 border-l-4 border-primary pl-4 text-white break-words">Ort</h4>
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-zinc-700/50 shadow-lg">
                                <iframe src={mapEmbedSrc} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Event Location" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 4. FOOTER: NO CHANGE, BUT NOW A GRID ROW --- */}
            <DialogFooter className="flex-col sm:flex-row gap-3 p-4 sm:p-8 pt-4 sm:pt-6 border-t border-zinc-800/50 bg-zinc-900/50">
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