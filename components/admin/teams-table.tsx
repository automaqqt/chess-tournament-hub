'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteTeam } from '@/lib/actions';
import TeamEditModal from './team-edit-modal';

type Team = {
  id: string;
  name: string;
  contactEmail: string;
  feeCategory: string;
  isPubliclyVisible: boolean;
  members: { id: string; firstName: string; lastName: string; birthYear: number; elo: number }[];
};

type TeamsTableProps = {
  teams: Team[];
  eventId: string;
  minTeamSize: number;
  maxTeamSize: number;
  feeOptions: { name: string; price: number }[];
};

export default function TeamsTable({ teams, eventId, minTeamSize, maxTeamSize, feeOptions }: TeamsTableProps) {
  const handleDelete = async (teamId: string, teamName: string) => {
    if (confirm(`Team "${teamName}" und alle Spieler wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      await deleteTeam(teamId, eventId);
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead>Spieler</TableHead>
            <TableHead>Startgeld</TableHead>
            <TableHead>Sichtbarkeit</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, index) => (
            <TableRow key={team.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {team.name}
                <div className="text-xs text-muted-foreground">
                  {team.members.map(m => `${m.firstName} ${m.lastName}`).join(', ')}
                </div>
              </TableCell>
              <TableCell>{team.contactEmail}</TableCell>
              <TableCell>{team.members.length}</TableCell>
              <TableCell>{team.feeCategory}</TableCell>
              <TableCell>
                <Badge variant={team.isPubliclyVisible ? 'default' : 'outline'}>
                  {team.isPubliclyVisible ? 'Öffentlich' : 'Privat'}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <TeamEditModal
                  team={team}
                  minTeamSize={minTeamSize}
                  maxTeamSize={maxTeamSize}
                  feeOptions={feeOptions}
                >
                  <Button variant="outline" size="icon" title="Team bearbeiten">
                    <span className="sr-only">Team bearbeiten</span>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TeamEditModal>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(team.id, team.name)}
                  title="Team löschen"
                >
                  <span className="sr-only">Team löschen</span>
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
