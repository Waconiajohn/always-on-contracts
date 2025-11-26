import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VaultRecommendationsPanel } from '../VaultRecommendationsPanel';

interface EnhanceItemsDrawerProps {
  open: boolean;
  onClose: () => void;
  vaultId: string;
  onItemUpdated?: () => void;
}

export const EnhanceItemsDrawer = ({ open, onClose, vaultId, onItemUpdated }: EnhanceItemsDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Enhance Vault Items</SheetTitle>
          <SheetDescription>
            AI-powered suggestions to improve low-performing items in your vault
          </SheetDescription>
        </SheetHeader>
        <VaultRecommendationsPanel vaultId={vaultId} onItemUpdated={onItemUpdated} />
      </SheetContent>
    </Sheet>
  );
};
