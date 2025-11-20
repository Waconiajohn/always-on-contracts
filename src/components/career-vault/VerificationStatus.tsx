import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface VerificationStatusProps {
  vaultId: string;
}

interface VerificationResult {
  id: string;
  verification_status: 'pass' | 'warning' | 'fail';
  results: any[];
  discrepancies_found: number;
  remediation_status: string | null;
  remediation_notes: string | null;
  created_at: string;
}

export function VerificationStatus({ vaultId }: VerificationStatusProps) {
  const navigate = useNavigate();
  const [latestVerification, setLatestVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestVerification();
  }, [vaultId]);

  const fetchLatestVerification = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_verification_results')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching verification:', error);
      } else if (data) {
        // Type cast the verification_status and results to the correct types
        const result: VerificationResult = {
          ...data,
          verification_status: data.verification_status as 'pass' | 'warning' | 'fail',
          discrepancies_found: data.discrepancies_found || 0,
          results: (data.results || []) as any[]
        };
        setLatestVerification(result);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: 'pass' | 'warning' | 'fail' }) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'fail':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Checking verification status...</span>
        </div>
      </Card>
    );
  }

  if (!latestVerification) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>No verification has been run yet. Verification runs automatically after resume extraction.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/resume-data-audit')}
            >
              Run Manual Verification
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`p-4 ${getStatusColor(latestVerification.verification_status)}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon status={latestVerification.verification_status} />
            <div>
              <h4 className="font-semibold">Data Verification</h4>
              <p className="text-sm text-muted-foreground">
                Last checked: {new Date(latestVerification.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge
            variant={
              latestVerification.verification_status === 'pass' ? 'default' :
              latestVerification.verification_status === 'warning' ? 'secondary' :
              'destructive'
            }
          >
            {latestVerification.verification_status.toUpperCase()}
          </Badge>
        </div>

        {latestVerification.discrepancies_found > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">
                {latestVerification.discrepancies_found} discrepanc{latestVerification.discrepancies_found === 1 ? 'y' : 'ies'} found
              </p>
              {latestVerification.remediation_status && (
                <p className="text-sm mt-1">
                  Remediation status: <Badge variant="outline">{latestVerification.remediation_status}</Badge>
                </p>
              )}
              {latestVerification.remediation_notes && (
                <div className="mt-2 text-sm whitespace-pre-line">
                  {latestVerification.remediation_notes}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/resume-data-audit')}
          className="w-full"
        >
          View Full Verification Report
        </Button>
      </div>
    </Card>
  );
}
