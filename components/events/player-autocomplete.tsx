'use client';

import { useState, useEffect, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Player = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  dwz: number | null;
  fideElo: number | null;
};

type PlayerAutocompleteProps = {
  onPlayerSelect: (player: Player) => void;
  selectedPlayer: Player | null;
};

export default function PlayerAutocomplete({ onPlayerSelect, selectedPlayer }: PlayerAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPlayers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setPlayers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Failed to search players:', error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlayers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPlayers]);

  const formatPlayerDisplay = (player: Player) => {
    const rating = player.dwz || player.fideElo || 'N/A';
    return `${player.lastName}, ${player.firstName} (Geb: ${player.birthYear}, DWZ: ${rating})`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPlayer
            ? formatPlayerDisplay(selectedPlayer)
            : "Spieler suchen..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white dark:bg-gray-950" align="start">
        <Command shouldFilter={false} className="bg-white dark:bg-gray-950">
          <CommandInput
            placeholder="Name eingeben..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm">Suche läuft...</span>
              </div>
            )}
            {!loading && searchQuery.length < 2 && (
              <CommandEmpty>Mindestens 2 Zeichen eingeben</CommandEmpty>
            )}
            {!loading && searchQuery.length >= 2 && players.length === 0 && (
              <CommandEmpty>Keine Spieler gefunden</CommandEmpty>
            )}
            {!loading && players.length > 0 && (
              <CommandGroup>
                {players.map((player) => (
                  <CommandItem
                    key={player.id}
                    value={player.id}
                    onSelect={() => {
                      onPlayerSelect(player);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedPlayer?.id === player.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {formatPlayerDisplay(player)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
