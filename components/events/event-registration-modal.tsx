// components/events/registration-modal.tsx

'use client';

import { useEffect, useState, useMemo, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { registerForEvent } from '@/lib/actions';
import { toast } from "sonner"
import type { Event } from '@prisma/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the proper type based on what registerForEvent actually returns
type RegistrationState = {
  type: string;
  message?: string;
  errors?: Record<string, string[]>;
  fields?: Record<string, unknown>;
};

const initialFormState: RegistrationState = {
  type: '',
};

const initialFormValues = {
    firstName: '',
    lastName: '',
    email: '',
    birthYear: '',
    elo: '',
    verein: '',
    agreeToTerms: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? 'Wird gesendet...' : 'Anmeldung bestätigen'}
    </Button>
  );
}

export default function RegistrationModal({ event, children }: { event: Event; children: React.ReactNode }) {
  const [state, formAction] = useActionState(registerForEvent, initialFormState);
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const feeOptions = useMemo(() => {
    return Array.isArray(event.fees) ? event.fees : [];
  }, [event.fees]);

  // --- NEW: Local state to control the form inputs ---
  type FormValues = {
    firstName: string;
    lastName: string;
    email: string;
    birthYear: string;
    elo: string;
    verein: string;
    agreeToTerms: boolean;
    [key: string]: string | boolean; // For dynamic custom fields
  };
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues as FormValues);

  useEffect(() => {
    if (state.type === 'success') {
      if ('message' in state) {
        toast.success(state.message);
      }
      setIsOpen(false);
      setFormValues(initialFormValues); // Reset form on success
    } else if (state.type === 'error') {
      if ('message' in state && state.message) {
        toast.error(state.message);
      }
      // --- NEW: Repopulate form with previous values on error ---
      if ('fields' in state && state.fields) {
        //@ts-expect-error cause its shiet
        setFormValues(prev => ({...prev, ...state.fields as Partial<FormValues>}));
      }
    }
  }, [state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormValues(prev => ({ ...prev, agreeToTerms: checked }));
  };

  // Check if form has been started (any field filled)
  const isFormTouched = () => {
    return formValues.firstName !== '' || 
           formValues.lastName !== '' || 
           formValues.email !== '' || 
           formValues.birthYear !== '' || 
           formValues.elo !== '' || 
           formValues.verein !== '';
  };

  // Handle modal close with confirmation if form is touched
  const handleModalClose = (open: boolean) => {
    if (!open && isFormTouched() && isOpen) {
      setShowConfirmClose(true);
    } else {
      setIsOpen(open);
    }
  };

  // Confirm close and reset form
  const confirmClose = () => {
    setShowConfirmClose(false);
    setIsOpen(false);
    setFormValues(initialFormValues);
  };

  // Cancel close confirmation
  const cancelClose = () => {
    setShowConfirmClose(false);
  };
  
  const customFields = useMemo(() => {
    if (!event.customFields) return [];
    return event.customFields.split(',').map(f => f.trim()).filter(f => f);
  }, [event.customFields]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-900/80 border-zinc-800 backdrop-blur-lg text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-merriweather text-primary">Anmeldung für {event.title}</DialogTitle>
          <DialogDescription>Füllen Sie das Formular aus, um sich anzumelden.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          <form action={formAction}>
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="agreeToTerms" value={formValues.agreeToTerms ? 'on' : 'off'} />
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" name="firstName" value={formValues.firstName} onChange={handleChange} />
                  {state.errors?.firstName && <p className="text-red-500 text-sm">{state.errors.firstName[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" name="lastName" value={formValues.lastName} onChange={handleChange} />
                  {state.errors?.lastName && <p className="text-red-500 text-sm">{state.errors.lastName[0]}</p>}
                </div>
              </div>
              {event.isPremier && (
                <p className="text-xs text-muted-foreground -mt-2">Ihr vollständiger Name muss in der Spielerliste stehen.</p>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" name="email" type="email" value={formValues.email} onChange={handleChange} />
                {state.errors?.email && <p className="text-red-500 text-sm">{state.errors.email[0]}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="birthYear">Geburtsjahr</Label>
                      <Input id="birthYear" name="birthYear" type="number" placeholder="e.g., 1995" value={formValues.birthYear} onChange={handleChange} />
                      {state.errors?.birthYear && <p className="text-red-500 text-sm">{state.errors.birthYear[0]}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="elo">ELO-Zahl</Label>
                      <Input id="elo" name="elo" type="number" placeholder="e.g., 1800" value={formValues.elo} onChange={handleChange} />
                      {state.errors?.elo && <p className="text-red-500 text-sm">{state.errors.elo[0]}</p>}
                  </div>
              </div>

              {feeOptions.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="feeCategory">Startgeld-Kategorie</Label>
                        <Select name="feeCategory" defaultValue={state.fields?.feeCategory as string | undefined}>
                            <SelectTrigger>
                                <SelectValue placeholder="Kategorie auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {(feeOptions as { name: string; price: number }[]).map((fee) => (
                                    <SelectItem key={fee.name} value={fee.name}>
                                        {fee.name} - ${fee.price}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {state.errors?.feeCategory && <p className="text-red-500 text-sm">{state.errors.feeCategory[0]}</p>}
                    </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="verein">Verein (Optional)</Label>
                <Input id="verein" name="verein" value={formValues.verein} onChange={handleChange} />
                {state.errors?.verein && <p className="text-red-500 text-sm">{state.errors.verein[0]}</p>}
              </div>

              {customFields.length > 0 && (
                <div className="pt-4 mt-4 border-t border-zinc-700 space-y-4">
                    <h3 className="font-semibold text-text-light">Zusätzliche Informationen</h3>
                    {customFields.map(field => (
                        <div key={field} className="space-y-2">
                            <Label htmlFor={field}>{field}</Label>
                            
                            <Input id={field} name={field} value={typeof formValues[field] === 'string' ? formValues[field] : ''} onChange={handleChange} />
                            {state.errors?.[field] && <p className="text-red-500 text-sm">{state.errors[field][0]}</p>}
                        </div>
                    ))}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-zinc-700">
                <Checkbox 
                  id="agreeToTerms" 
                  name="agreeToTerms"
                  checked={formValues.agreeToTerms}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                  Ich stimme AGB und Datenschutzerklärung zu
                </Label>
              </div>
              {state.errors?.agreeToTerms && <p className="text-red-500 text-sm">{state.errors.agreeToTerms[0]}</p>}
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleModalClose(false)}
              >
                Abbrechen
              </Button>
              <SubmitButton />
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog */}
    <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900/80 border-zinc-800 backdrop-blur-lg text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-merriweather text-primary">Anmeldung wirklich abbrechen?</DialogTitle>
          <DialogDescription>
            Sie haben bereits Daten eingegeben. Wenn Sie jetzt abbrechen, gehen alle eingegebenen Daten verloren.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={cancelClose}>
            Weiter ausfüllen
          </Button>
          <Button variant="destructive" onClick={confirmClose}>
            Ja, abbrechen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}