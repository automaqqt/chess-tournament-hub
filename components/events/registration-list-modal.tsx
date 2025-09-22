'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';

type Registration = {
  index: number;
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  verein: string | null;
  elo: number | null;
  isPubliclyVisible: boolean;
};

type RegistrationResponse = {
  registrations: Registration[];
  totalCount: number;
  publicCount: number;
};

type RegistrationListModalProps = {
  eventId: string;
  registrationCount: number;
  children: React.ReactNode;
};

export default function RegistrationListModal({ eventId, registrationCount, children }: RegistrationListModalProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [publicCount, setPublicCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/registrations`);
      if (response.ok) {
        const data: RegistrationResponse = await response.json();
        setRegistrations(data.registrations);
        setTotalCount(data.totalCount);
        setPublicCount(data.publicCount);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && registrations.length === 0) {
      fetchRegistrations();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-zinc-900/80 border-zinc-800 backdrop-blur-lg text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-merriweather text-primary flex items-center gap-2">
            <Users className="h-6 w-6" />
            Anmeldungen ({totalCount > 0 ? totalCount : registrationCount})
          </DialogTitle>
          <DialogDescription>
            Übersicht aller angemeldeten Teilnehmer für diese Veranstaltung.
            {totalCount > 0 && publicCount < totalCount && (
              <span className="block text-xs text-muted-foreground mt-1">
                {publicCount} öffentlich, {totalCount - publicCount} privat
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Lade Anmeldungen...</div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Noch keine Anmeldungen vorhanden.</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-zinc-800 border-zinc-700">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead className="text-right">ELO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow 
                    key={registration.id || `private-${registration.index}`} 
                    className={`border-zinc-800 ${registration.isPubliclyVisible ? 'hover:bg-zinc-800' : 'opacity-60'}`}
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {registration.index}
                    </TableCell>
                    <TableCell className="font-medium">
                      {registration.isPubliclyVisible ? (
                        `${registration.firstName} ${registration.lastName}`
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-20 bg-zinc-700 rounded animate-pulse"></div>
                          <span className="text-xs text-muted-foreground">(privat)</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {registration.isPubliclyVisible ? (
                        registration.verein || 'N/A'
                      ) : (
                        <div className="h-3 w-16 bg-zinc-700 rounded animate-pulse"></div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {registration.isPubliclyVisible ? (
                        registration.elo && registration.elo > 0 ? registration.elo : '-'
                      ) : (
                        <div className="h-3 w-12 bg-zinc-700 rounded animate-pulse ml-auto"></div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}