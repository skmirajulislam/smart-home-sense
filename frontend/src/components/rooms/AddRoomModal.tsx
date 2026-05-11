import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRoomStore } from '@/store/useRoomStore';
import { Sofa, Bed, CookingPot, Box, Bath, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = [
  { name: 'Sofa', icon: Sofa },
  { name: 'Bed', icon: Bed },
  { name: 'CookingPot', icon: CookingPot },
  { name: 'Box', icon: Box },
];

interface AddRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRoomModal({ open, onOpenChange }: AddRoomModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Box');
  const addRoom = useRoomStore((s) => s.addRoom);

  const handleSubmit = () => {
    if (!name.trim()) return;
    addRoom(name.trim(), selectedIcon);
    setName('');
    setSelectedIcon('Box');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Room Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Office" />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic.name}
                  onClick={() => setSelectedIcon(ic.name)}
                  className={cn(
                    'h-10 w-10 rounded-lg border flex items-center justify-center transition-colors',
                    selectedIcon === ic.name
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <ic.icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Add Room</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
