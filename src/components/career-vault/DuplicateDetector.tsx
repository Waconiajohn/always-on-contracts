import { AutoDuplicateCleanup } from './AutoDuplicateCleanup';

interface DuplicateDetectorProps {
  vaultId: string;
  onCleanupComplete?: () => void;
}

/**
 * Legacy wrapper for AutoDuplicateCleanup component
 * @deprecated Use AutoDuplicateCleanup directly
 */
export const DuplicateDetector = ({ vaultId, onCleanupComplete }: DuplicateDetectorProps) => {
  return <AutoDuplicateCleanup vaultId={vaultId} onCleanupComplete={onCleanupComplete} />;
};
