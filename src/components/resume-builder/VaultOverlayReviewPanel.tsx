// src/components/resume-builder/VaultOverlayReviewPanel.tsx
import React from "react";
import { useResumeBuilderStore } from "@/stores/resumeBuilderStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface VaultOverlayReviewPanelProps {
  onClose: () => void;
}

export const VaultOverlayReviewPanel: React.FC<VaultOverlayReviewPanelProps> = ({
  onClose,
}) => {
  const { toast } = useToast();
  const {
    vaultOverlay,
    commitVaultPromotions,
    rejectSuggestion,
  } = useResumeBuilderStore();

  const pending = vaultOverlay?.pendingVaultPromotions ?? [];

  const hasItems = pending.length > 0;

  const handleCommit = async () => {
    try {
      await commitVaultPromotions();
      toast({
        title: "Career Vault updated",
        description: "Approved items have been added to your Career Vault.",
      });
      onClose();
    } catch (error) {
      console.error("Error committing vault promotions", error);
      toast({
        title: "Update failed",
        description: "We couldn't update your Career Vault. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!hasItems) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold">Career Vault updates</h3>
            <p className="text-xs text-muted-foreground mt-1">
              There are no pending changes to your Career Vault from this
              resume build.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">
            Review changes to your Career Vault
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            These items came from this job&apos;s gap analysis and were marked
            &quot;Add to Career Vault.&quot; You can approve them now or
            remove anything that doesn&apos;t feel accurate.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <ScrollArea className="max-h-72 border rounded-md p-2">
        <div className="space-y-3">
          {pending.map((item) => {
            const payload: any = item.payload || {};
            const type = payload.type || "impact_statement";
            const text = payload.text || "";
            const requirementId = item.requirementId;

            return (
              <div
                key={item.id}
                className="border rounded-md p-3 flex flex-col gap-2 bg-muted/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {type === "impact_statement"
                        ? "Impact statement"
                        : type === "transferable_skill"
                        ? "Transferable skill"
                        : "Career detail"}
                    </Badge>
                    {payload.jobTitle && (
                      <Badge variant="outline" className="text-[11px]">
                        Target role: {payload.jobTitle}
                      </Badge>
                    )}
                    {requirementId && (
                      <Badge variant="outline" className="text-[11px]">
                        From requirement match
                      </Badge>
                    )}
                    {payload.quality_tier && (
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {payload.quality_tier} tier
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-snug whitespace-pre-line">
                  {text}
                </p>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rejectSuggestion(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground">
        <p>
          Approved items become part of your permanent Career Vault. Future
          resumes and LinkedIn updates can reuse them automatically.
        </p>
        <p>
          You stay in control – nothing is added to your Career Vault without
          your explicit approval.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Not now
        </Button>
        <Button size="sm" onClick={handleCommit}>
          Approve & update Career Vault
        </Button>
      </div>
    </Card>
  );
};
