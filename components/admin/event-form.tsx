// components/admin/event-form.tsx

'use client';

import { useFormStatus } from 'react-dom';
import { createEvent, updateEvent } from '@/lib/actions';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { Event } from '@prisma/client';

// Define a proper type for the form state that matches what your actions return
type FormState = {
  type: string;
  message?: string;
  errors?: {
    title?: string[];
    description?: string[];
    fullDetails?: string[];
    date?: string[];
    location?: string[];
    fees?: string[];
    type?: string[];
    isPremier?: string[];
    isEloRequired?: string[];
    customFields?: string[];
    registrationEndDate?: string[];
    pdfFile?: string[];
    organiserEmail?: string[];
    emailText?: string[];
  };
  fields?: {
    [key: string]: FormDataEntryValue;
  };
};

const initialFormState: FormState = {
  type: '',
  errors: {},
  fields: {},
};

const feesToString = (fees: { name: string; price: number }[]) => {
    if (!Array.isArray(fees)) return '';
    return fees.map(f => `${f.name}:${f.price}`).join(', ');
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={"outline"} disabled={pending} className="w-full sm:w-auto">{pending ? (isEditing ? 'Speichern...' : 'Erstellen...') : (isEditing ? 'Änderungen speichern' : 'Veranstaltung erstellen')}</Button>;
}

export default function EventForm({ event }: { event?: Event }) {
  const isEditing = !!event;
  
  // Create wrapper to fix type signature
  const formAction = async (state: FormState, formData: FormData): Promise<FormState> => {
    if (isEditing && event) {
      return await updateEvent(event.id, state, formData);
    } else {
      return await createEvent(state, formData);
    }
  };
  
  const [state, dispatch] = useActionState(formAction, initialFormState);

  // --- NEW: Local state to control form inputs ---
  // Initialize with event data for editing, or defaults for creating
  const [formData, setFormData] = useState(() => {
    if (event) {
      return {
        ...event,
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      };
    }
    return {
      title: '', description: '', fullDetails: '', date: '', location: '',
      entryFee: 0, type: 'classic', isPremier: false, isEloRequired: false, customFields: '', 
      emailText: 'Wir haben Ihre Anmeldung erhalten und freuen uns sehr, dass Sie dabei sind.\n',
      organiserEmail: ''
    };
  });

  // Separate state for fees management
  const [fees, setFees] = useState<{ name: string; price: number }[]>(
    event?.fees ? (Array.isArray(event.fees) ? event.fees as { name: string; price: number }[] : []) : []
  );

  useEffect(() => {
    if (state.type === 'error') {
      if (state.message) toast.error(state.message, { duration: 10000 });
      // --- NEW: Repopulate form on error ---
      if (state.fields) {
        setFormData(prev => ({ ...prev, ...state.fields }));
      }
    }
  }, [state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData(prev => ({...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
  };

  const addFee = () => {
    setFees(prev => [...prev, { name: '', price: 0 }]);
  };

  const removeFee = (index: number) => {
    setFees(prev => prev.filter((_, i) => i !== index));
  };

  const updateFee = (index: number, field: 'name' | 'price', value: string | number) => {
    setFees(prev => prev.map((fee, i) => 
      i === index ? { ...fee, [field]: field === 'price' ? Number(value) : value } : fee
    ));
  };

  const handleRichTextChange = (content: string) => {
    setFormData(prev => ({...prev, fullDetails: content}));
  };

  return (
    <form action={dispatch} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Veranstaltungstitel</Label>
        <Input id="title" name="title" value={formData.title} onChange={handleChange} />
        {state.errors?.title && <p className="text-red-500 text-sm">{state.errors.title[0]}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <Label htmlFor="date">Datum und Uhrzeit</Label>
            <Input 
              id="date" 
              name="date" 
              type="datetime-local" 
              value={formData.date || ''} 
              onChange={handleChange} 
            />
            {state.errors?.date && <p className="text-red-500 text-sm">{state.errors.date[0]}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="location">Ort</Label>
            <Input id="location" name="location" value={formData.location} onChange={handleChange} />
            {state.errors?.location && <p className="text-red-500 text-sm">{state.errors.location[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Kurzbeschreibung (für Karte)</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
        {state.errors?.description && <p className="text-red-500 text-sm">{state.errors.description[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label>Vollständige Details (für Modal)</Label>
        <RichTextEditor
          content={formData.fullDetails || ''}
          onChange={handleRichTextChange}
          placeholder="Detaillierte Informationen über die Veranstaltung..."
        />
        <input type="hidden" name="fullDetails" value={formData.fullDetails} />
        {state.errors?.fullDetails && <p className="text-red-500 text-sm">{state.errors.fullDetails[0]}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
                    <Label htmlFor="registrationEndDate">Anmeldeschluss</Label>
                    <Input id="registrationEndDate" name="registrationEndDate" type="date" defaultValue={event?.registrationEndDate ? new Date(event.registrationEndDate).toISOString().split('T')[0] : ''} />
                    {state.errors?.registrationEndDate && <p className="text-red-500 text-sm">{state.errors.registrationEndDate[0]}</p>}
                </div>
        <div className="space-y-2">
            <Label>Event Type</Label>
             <Select name="type" value={formData.type} onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}>
                <SelectTrigger><SelectValue placeholder="Veranstaltungstyp auswählen" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="classic">Klassisch</SelectItem>
                    <SelectItem value="rapid">Schnellschach</SelectItem>
                    <SelectItem value="blitz">Blitz</SelectItem>
                    <SelectItem value="scholastic">Jugendturnier</SelectItem>
                </SelectContent>
            </Select>
            {state.errors?.type && <p className="text-red-500 text-sm">{state.errors.type[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Startgeld-Kategorien</Label>
        <div className="space-y-3">
          {fees.map((fee, index) => (
            <div key={index} className="flex gap-3 items-center">
              <Input
                placeholder="Kategoriename (z.B. Erwachsene)"
                value={fee.name}
                onChange={(e) => updateFee(index, 'name', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Preis"
                value={fee.price}
                onChange={(e) => updateFee(index, 'price', e.target.value)}
                className="w-24"
                min="0"
              />
              <span className="text-sm text-muted-foreground">€</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFee(index)}
                className="px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addFee}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Startgeld-Kategorie hinzufügen
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Leer lassen für kostenlose Veranstaltung.</p>
        {state.errors?.fees && <p className="text-red-500 text-sm">{state.errors.fees[0]}</p>}
        
        {/* Hidden input to submit fees data */}
        <input type="hidden" name="fees" value={feesToString(fees)} />
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                    <Label htmlFor="pdfFile">Veranstaltungsflyer (PDF)</Label>
                    <Input id="pdfFile" name="pdfFile" type="file" accept=".pdf" />
                    {event?.pdfUrl && <p className="text-sm text-muted-foreground mt-2">Aktuelle Datei: <a href={event.pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">{event.pdfUrl.split('/').pop()}</a></p>}
                    <p className="text-sm text-muted-foreground">Optional. Neue Datei hochladen, um die vorhandene zu ersetzen.</p>
                </div>
            </div>

      <div className="space-y-2">
        <Label htmlFor="customFields">Benutzerdefinierte Anmeldefelder</Label>
        <Input id="customFields" name="customFields" placeholder="e.g., T-Shirt Size, Emergency Contact" value={formData.customFields} onChange={handleChange} />
        <p className="text-sm text-muted-foreground">Kommagetrennte Liste zusätzlicher Felder eingeben.</p>
        {state.errors?.customFields && <p className="text-red-500 text-sm">{state.errors.customFields[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailText">Zusätzlicher E-Mail-Text</Label>
        <Textarea 
          id="emailText" 
          name="emailText" 
          rows={4}
          value={formData.emailText} 
          onChange={handleChange}
          placeholder="Zusätzlicher Text für die Anmeldungsbestätigung..."
        />
        <p className="text-sm text-muted-foreground">
          Dieser Text wird zwischen den Veranstaltungsinformationen und den Zahlungsdaten eingefügt.<br/>
        </p>
        {state.errors?.emailText && <p className="text-red-500 text-sm">{state.errors.emailText[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organiserEmail">Organisator-E-Mail (BCC)</Label>
        <Input 
          id="organiserEmail" 
          name="organiserEmail" 
          type="email"
          value={formData.organiserEmail || ''} 
          onChange={handleChange}
          placeholder="organisator@beispiel.de"
        />
        <p className="text-sm text-muted-foreground">
          Optional. Diese E-Mail-Adresse erhält eine Kopie jeder Anmeldung als BCC.
        </p>
        {state.errors?.organiserEmail && <p className="text-red-500 text-sm">{state.errors.organiserEmail[0]}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="isPremier" name="isPremier" checked={!!formData.isPremier} onCheckedChange={(checked) => setFormData(prev => ({...prev, isPremier: !!checked}))} />
          <Label htmlFor="isPremier" className="text-sm font-medium leading-none">Als interne Schachzwerge Veranstaltung markieren</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="isEloRequired" name="isEloRequired" checked={!!formData.isEloRequired} onCheckedChange={(checked) => setFormData(prev => ({...prev, isEloRequired: !!checked}))} />
          <Label htmlFor="isEloRequired" className="text-sm font-medium leading-none">ELO-Zahl als Pflichtfeld</Label>
        </div>
      </div>

      <div className="flex justify-end"><SubmitButton isEditing={isEditing} /></div>
    </form>
  );
}