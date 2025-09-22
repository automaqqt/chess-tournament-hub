'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deleteRegistration } from "@/lib/actions";

type Registration = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthYear: number;
  verein: string;
  elo: number;
  isPubliclyVisible: boolean;
  additionalInfo: Record<string, unknown>;
};

type RegistrationsTableProps = {
  registrations: Registration[];
  eventId: string;
  customFieldHeaders: string[];
};

export default function RegistrationsTable({ registrations, eventId, customFieldHeaders }: RegistrationsTableProps) {
  const handleDelete = async (registrationId: string, participantName: string) => {
    if (confirm(`Sind Sie sicher, dass Sie die Anmeldung von "${participantName}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      await deleteRegistration(registrationId, eventId);
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Geburtsjahr</TableHead>
            <TableHead>Verein</TableHead>
            <TableHead>ELO</TableHead>
            <TableHead>Sichtbarkeit</TableHead>
            {customFieldHeaders.map(header => (
              <TableHead key={header}>{header}</TableHead>
            ))}
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((reg, index) => (
            <TableRow key={reg.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{reg.firstName} {reg.lastName}</TableCell>
              <TableCell>{reg.email}</TableCell>
              <TableCell>{reg.birthYear}</TableCell>
              <TableCell>{reg.verein}</TableCell>
              <TableCell>
                <Badge variant="secondary">{reg.elo}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={reg.isPubliclyVisible ? "default" : "outline"}>
                  {reg.isPubliclyVisible ? "Öffentlich" : "Privat"}
                </Badge>
              </TableCell>
              {customFieldHeaders.map(header => (
                <TableCell key={header}>
                  {String(reg.additionalInfo?.[header] || 'N/A')}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(reg.id, `${reg.firstName} ${reg.lastName}`)}
                  title="Anmeldung löschen"
                >
                  <span className="sr-only">Anmeldung löschen</span>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}