'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Table } from "lucide-react";

type ExportModalProps = {
  eventId: string;
  eventTitle: string;
  children: React.ReactNode;
};

export default function ExportModal({ eventId, eventTitle, children }: ExportModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle>Export wählen</DialogTitle>
          <DialogDescription>
            Wählen Sie das Exportformat für &quot;{eventTitle}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            asChild
            variant="outline"
            className="w-full justify-start"
          >
            <a href={`/api/export/${eventId}?format=csv`} download>
              <Table className="mr-2 h-4 w-4" />
              CSV Export (Komplett)
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full justify-start"
          >
            <a href={`/api/export/${eventId}?format=swiss`} download>
              <FileText className="mr-2 h-4 w-4" />
              Swiss Chess Format (TXT)
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
