// components/admin/event-form.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createEvent, updateEvent } from '@/lib/actions';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Event } from '@prisma/client';

const initialFormState = {
  type: '',
  message: '',
  errors: null as Record<string, string[]> | null,
  fields: null as Record<string, unknown> | null,

};
const feesToString = (fees: { name: string; price: number }[]) => {
    if (!Array.isArray(fees)) return '';
    return fees.map(f => `${f.name}:${f.price}`).join(', ');
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Event')}</Button>;
}

export default function EventForm({ event }: { event?: Event }) {
  const isEditing = !!event;
  const formAction = isEditing ? updateEvent.bind(null, event.id) : createEvent;
  const [state, dispatch] = useFormState(formAction, initialFormState);

  // --- NEW: Local state to control form inputs ---
  // Initialize with event data for editing, or defaults for creating
  const [formData, setFormData] = useState(event || {
    title: '', description: '', fullDetails: '', date: '', location: '',
    entryFee: 0, type: 'classic', isPremier: false, customFields: ''
  });

  useEffect(() => {
    if (state.type === 'error') {
      if (state.message) toast.error(state.message);
      // --- NEW: Repopulate form on error ---
      if (state.fields) {
        setFormData(prev => ({ ...prev, ...state.fields }));
      }
    }
  }, [state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // @ts-expect-error - Dynamic property assignment on form data
    setFormData(prev => ({...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
  };

  return (
    <form action={dispatch} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input id="title" name="title" value={formData.title} onChange={handleChange} />
        {state.errors?.title && <p className="text-red-500 text-sm">{state.errors.title[0]}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" placeholder="e.g., January 1-3, 2025" value={formData.date} onChange={handleChange} />
            {state.errors?.date && <p className="text-red-500 text-sm">{state.errors.date[0]}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" value={formData.location} onChange={handleChange} />
            {state.errors?.location && <p className="text-red-500 text-sm">{state.errors.location[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short Description (for card)</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
        {state.errors?.description && <p className="text-red-500 text-sm">{state.errors.description[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullDetails">Full Details (for modal)</Label>
        <Textarea id="fullDetails" name="fullDetails" rows={5} value={formData.fullDetails} onChange={handleChange} />
        {state.errors?.fullDetails && <p className="text-red-500 text-sm">{state.errors.fullDetails[0]}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
                    <Label htmlFor="registrationEndDate">Registration Deadline</Label>
                    <Input id="registrationEndDate" name="registrationEndDate" type="date" defaultValue={event?.registrationEndDate.toISOString().split('T')[0]} />
                    {state.errors?.registrationEndDate && <p className="text-red-500 text-sm">{state.errors.registrationEndDate[0]}</p>}
                </div>
        <div className="space-y-2">
            <Label>Event Type</Label>
             <Select name="type" value={formData.type} onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}>
                <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="rapid">Rapid</SelectItem>
                    <SelectItem value="blitz">Blitz</SelectItem>
                    <SelectItem value="scholastic">Scholastic</SelectItem>
                </SelectContent>
            </Select>
            {state.errors?.type && <p className="text-red-500 text-sm">{state.errors.type[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
                <Label htmlFor="fees">Fee Categories</Label>
                <Textarea id="fees" name="fees" placeholder="e.g., Adult:50, Junior:30, Student:25" defaultValue={feesToString(event?.fees)} />
                <p className="text-sm text-muted-foreground">Format: Category Name:Price, another:Price. No dollar signs.</p>
                {state.errors?.fees && <p className="text-red-500 text-sm">{state.errors.fees[0]}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                    <Label htmlFor="pdfFile">Event Flyer (PDF)</Label>
                    <Input id="pdfFile" name="pdfFile" type="file" accept=".pdf" />
                    {event?.pdfUrl && <p className="text-sm text-muted-foreground mt-2">Current file: <a href={event.pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">{event.pdfUrl.split('/').pop()}</a></p>}
                    <p className="text-sm text-muted-foreground">Optional. Upload a new file to replace the existing one.</p>
                </div>
            </div>

      <div className="space-y-2">
        <Label htmlFor="customFields">Custom Registration Fields</Label>
        <Input id="customFields" name="customFields" placeholder="e.g., T-Shirt Size, Emergency Contact" value={formData.customFields} onChange={handleChange} />
        <p className="text-sm text-muted-foreground">Enter a comma-separated list of extra fields.</p>
        {state.errors?.customFields && <p className="text-red-500 text-sm">{state.errors.customFields[0]}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="isPremier" name="isPremier" checked={!!formData.isPremier} onCheckedChange={(checked) => setFormData(prev => ({...prev, isPremier: !!checked}))} />
        <Label htmlFor="isPremier" className="text-sm font-medium leading-none">Mark as Premier Event</Label>
      </div>

      <div className="flex justify-end"><SubmitButton isEditing={isEditing} /></div>
    </form>
  );
}