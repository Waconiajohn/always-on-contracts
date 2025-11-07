import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, RefreshCw } from 'lucide-react';

interface VaultHeaderProps {
  vault: any;
  grade: string;
  onResumeClick: () => void;
  onReanalyze: () => void;
  isReanalyzing: boolean;
}

export const VaultHeader = ({ vault, grade, onResumeClick, onReanalyze, isReanalyzing }: VaultHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Career Vault</h1>
        <div className="flex items-center gap-2">
          <Badge variant={grade === 'A+' || grade === 'A' ? 'default' : 'secondary'} className="text-sm">
            Grade: {grade}
          </Badge>
          {vault?.vault_version && (
            <Badge variant="outline" className="text-xs">
              v{vault.vault_version}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onResumeClick}>
          <FileText className="h-4 w-4 mr-2" />
          Manage Resume
        </Button>
        <Button variant="outline" size="sm" onClick={onReanalyze} disabled={isReanalyzing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isReanalyzing ? 'animate-spin' : ''}`} />
          {isReanalyzing ? 'Re-analyzing...' : 'Re-analyze'}
        </Button>
      </div>
    </div>
  );
};
