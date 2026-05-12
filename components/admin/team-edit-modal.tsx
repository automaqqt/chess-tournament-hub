'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X } from 'lucide-react';
import { updateTeam } from '@/lib/actions';

type Member = {
  id?: string;
  firstName: string;
  lastName: string;
  birthYear: string;
  elo: string;
};

type TeamEditModalProps = {
  team: {
    id: string;
    name: string;
    contactEmail: string;
    feeCategory: string;
    isPubliclyVisible: boolean;
    members: { id: string; firstName: string; lastName: string; birthYear: number; elo: number }[];
  };
  minTeamSize: number;
  maxTeamSize: number;
  feeOptions: { name: string; price: number }[];
  children: React.ReactNode;
};

type State = { type: string; message?: string; errors?: Record<string, string[]> };
const initialState: State = { type: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? 'Speichern...' : 'Speichern'}
    </Button>
  );
}

export default function TeamEditModal({ team, minTeamSize, maxTeamSize, feeOptions, children }: TeamEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const action = updateTeam.bind(null, team.id);
  const [state, formAction] = useActionState(action, initialState);

  const [name, setName] = useState(team.name);
  const [contactEmail, setContactEmail] = useState(team.contactEmail);
  const [feeCategory, setFeeCategory] = useState(team.feeCategory);
  const [isPubliclyVisible, setIsPubliclyVisible] = useState(team.isPubliclyVisible);
  const [members, setMembers] = useState<Member[]>(() =>
    team.members.map(m => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      birthYear: String(m.birthYear),
      elo: m.elo > 0 ? String(m.elo) : '',
    }))
  );

  useEffect(() => {
    if (state.type === 'success') {
      toast.success(state.message ?? 'Team aktualisiert.');
      setIsOpen(false);
    } else if (state.type === 'error' && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setMembers(prev => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addMember = () => {
    if (members.length >= maxTeamSize) return;
    setMembers(prev => [...prev, { firstName: '', lastName: '', birthYear: '', elo: '' }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= minTeamSize) return;
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-zinc-900/90 border-zinc-800 backdrop-blur-lg text-white">
        <DialogHeader>
          <DialogTitle>Team bearbeiten</DialogTitle>
          <DialogDescription>Teamname, Kontakt und Spielerliste anpassen.</DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <input type="hidden" name="isPubliclyVisible" value={isPubliclyVisible ? 'on' : 'off'} />

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Teamname</Label>
                <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} />
                {state.errors?.name && <p className="text-red-500 text-sm">{state.errors.name[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Kontakt-E-Mail</Label>
                <Input id="contactEmail" name="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                {state.errors?.contactEmail && <p className="text-red-500 text-sm">{state.errors.contactEmail[0]}</p>}
              </div>

              {feeOptions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="feeCategory">Startgeld-Kategorie</Label>
                  <select
                    id="feeCategory"
                    name="feeCategory"
                    value={feeCategory}
                    onChange={(e) => setFeeCategory(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm"
                  >
                    <option value="">Keine Auswahl</option>
                    {feeOptions.map(fee => (
                      <option key={fee.name} value={fee.name}>{fee.name} – {fee.price}€</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="teamPublic"
                  checked={isPubliclyVisible}
                  onCheckedChange={(c) => setIsPubliclyVisible(!!c)}
                />
                <Label htmlFor="teamPublic" className="text-sm">In öffentlicher Teamliste anzeigen</Label>
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Spieler ({members.length} / {maxTeamSize})</h3>
                  <p className="text-xs text-muted-foreground">Min. {minTeamSize}, max. {maxTeamSize}</p>
                </div>
                {state.errors?.members && <p className="text-red-500 text-sm">{state.errors.members[0]}</p>}

                {members.map((member, index) => (
                  <div key={member.id ?? `new-${index}`} className="rounded-md border border-zinc-700/60 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Spieler {index + 1}</span>
                      {members.length > minTeamSize && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(index)}
                          className="h-7 px-2 text-muted-foreground hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {member.id && (
                      <input type="hidden" name={`members[${index}].id`} value={member.id} />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Vorname"
                        name={`members[${index}].firstName`}
                        value={member.firstName}
                        onChange={(e) => updateMember(index, 'firstName', e.target.value)}
                      />
                      <Input
                        placeholder="Nachname"
                        name={`members[${index}].lastName`}
                        value={member.lastName}
                        onChange={(e) => updateMember(index, 'lastName', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Geburtsjahr"
                        name={`members[${index}].birthYear`}
                        value={member.birthYear}
                        onChange={(e) => updateMember(index, 'birthYear', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="DWZ (optional)"
                        name={`members[${index}].elo`}
                        value={member.elo}
                        onChange={(e) => updateMember(index, 'elo', e.target.value)}
                      />
                    </div>
                    {state.errors?.[`members.${index}`] && (
                      <p className="text-red-500 text-sm">{state.errors[`members.${index}`][0]}</p>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addMember}
                  disabled={members.length >= maxTeamSize}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Spieler hinzufügen
                </Button>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Abbrechen</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
