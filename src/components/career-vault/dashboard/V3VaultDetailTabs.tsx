import { useState } from "react";
import type { VaultData } from "@/hooks/useVaultData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VaultItemViewModal } from "@/components/career-vault/VaultItemViewModal";
import { VaultItemEditModal } from "@/components/career-vault/VaultItemEditModal";

interface V3VaultDetailTabsProps {
  vault: VaultData;
}

const TABS = [
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Strengths & Skills" },
  { id: "intangibles", label: "Leadership & Style" },
  { id: "documents", label: "Documents" },
];

/**
 * Calm tabbed view of what's in the vault.
 * This gives the user a sense of "what the system knows about me".
 */
export function V3VaultDetailTabs({ vault }: V3VaultDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("experience");

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-3">
        <div className="flex gap-4 border-b mb-3 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`pb-2 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "experience" && <ExperienceTab vault={vault} />}
        {activeTab === "skills" && <SkillsTab vault={vault} />}
        {activeTab === "intangibles" && <IntangiblesTab vault={vault} />}
        {activeTab === "documents" && <DocumentsTab vault={vault} />}
      </CardContent>
    </Card>
  );
}

function ExperienceTab({ vault }: { vault: VaultData }) {
  const context: any = vault.careerContext || {};
  const roles: any[] = context.roles || context.extracted_roles || [];
  const [selectedRole, setSelectedRole] = useState<any | null>(null);

  if (!roles.length) {
    return (
      <p className="text-sm text-muted-foreground">
        As we review your resume and answers, we&apos;ll build a clear timeline of
        your roles here. This helps align you to the right level, scope, and
        type of opportunity.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {roles.map((role, index) => {
          const title =
            role.title ||
            role.role_title ||
            role.position ||
            "Role";
          const company =
            role.company ||
            role.organization ||
            role.employer ||
            "";
          const start =
            role.start_date || role.start || role.start_year || "";
          const end =
            role.end_date || role.end || role.end_year || "Present";
          const location = role.location || role.city || role.region || "";

          return (
            <div
              key={role.id || index}
              className="border rounded-md px-3 py-2 flex items-start justify-between gap-3"
            >
              <div>
                <div className="text-sm font-medium">
                  {title}
                  {company && <> @ {company}</>}
                </div>
                {(start || end) && (
                  <div className="text-xs text-muted-foreground">
                    {start} – {end}
                  </div>
                )}
                {location && (
                  <div className="text-xs text-muted-foreground">
                    {location}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => setSelectedRole(role)}
              >
                View
              </Button>
            </div>
          );
        })}
      </div>

      {selectedRole && (
        <VaultItemViewModal
          item={{
            id: selectedRole.id || "",
            category: "Experience",
            content: {
              text: `${selectedRole.title || selectedRole.role_title || "Role"} @ ${selectedRole.company || selectedRole.organization || ""}`,
              ...selectedRole,
            },
            quality_tier: "gold",
          }}
          open={!!selectedRole}
          onOpenChange={(open) => !open && setSelectedRole(null)}
        />
      )}
    </>
  );
}

function SkillsTab({ vault }: { vault: VaultData }) {
  const power = (vault.powerPhrases as any[]) || [];
  const transferable = (vault.transferableSkills as any[]) || [];
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);

  if (!power.length && !transferable.length) {
    return (
      <p className="text-sm text-muted-foreground">
        As your Career Vault grows, we&apos;ll highlight your most powerful
        statements and transferable skills here so they can be quickly reused
        in resumes, LinkedIn, and interviews.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {!!power.length && (
          <div>
            <div className="text-xs font-semibold mb-2 uppercase text-muted-foreground flex items-center justify-between">
              <span>Impact statements</span>
              <span className="text-muted-foreground font-normal text-[11px]">
                ({power.length})
              </span>
            </div>
            <ul className="space-y-2">
              {power.map((p, index) => (
                <li key={p.id || index} className="flex items-start justify-between gap-3 text-sm border rounded-md px-3 py-2">
                  <span>• {p.text || p.phrase || p.description}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setSelectedItem({ ...p, category: "Career Achievement" })}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setEditItem({ ...p, category: "Career Achievement" })}
                    >
                      Edit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!transferable.length && (
          <div>
            <div className="text-xs font-semibold mb-2 uppercase text-muted-foreground flex items-center justify-between">
              <span>Transferable skills</span>
              <span className="text-muted-foreground font-normal">{transferable.length} items</span>
            </div>
            <ul className="flex flex-wrap gap-1">
              {transferable.map((s, index) => (
                <li
                  key={s.id || index}
                  className="text-xs rounded-full border px-2 py-1 bg-muted/40 cursor-pointer hover:bg-muted/60"
                  onClick={() => setSelectedItem({ ...s, category: "Skill & Expertise" })}
                >
                  {s.name || s.label || s.skill || s.skill_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selectedItem && (
        <VaultItemViewModal
          item={{
            id: selectedItem.id || "",
            category: selectedItem.category,
            content: {
              text: selectedItem.text || selectedItem.phrase || selectedItem.description || selectedItem.name || selectedItem.label || selectedItem.skill || selectedItem.skill_name,
              ...selectedItem,
            },
            quality_tier: selectedItem.quality_tier || "gold",
          }}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
        />
      )}

      {editItem && (
        <VaultItemEditModal
          item={{
            id: editItem.id || "",
            category: editItem.category,
            content: {
              text: editItem.text || editItem.phrase || editItem.description,
              ...editItem,
            },
            quality_tier: editItem.quality_tier || "gold",
          }}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          onSave={() => {
            setEditItem(null);
            // Could trigger vault refresh here if needed
          }}
        />
      )}
    </>
  );
}

function IntangiblesTab({ vault }: { vault: VaultData }) {
  const leadership = (vault.leadershipPhilosophy as any[]) || [];
  const presence = (vault.executivePresence as any[]) || [];
  const traits = (vault.personalityTraits as any[]) || [];
  const workStyle = (vault.workStyle as any[]) || [];
  const values = (vault.values as any[]) || [];
  const behavioral = (vault.behavioralIndicators as any[]) || [];

  const [selectedViewItem, setSelectedViewItem] = useState<any | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<any | null>(null);

  const hasAnything =
    leadership.length ||
    presence.length ||
    traits.length ||
    workStyle.length ||
    values.length ||
    behavioral.length;

  if (!hasAnything) {
    return (
      <p className="text-sm text-muted-foreground">
        We&apos;ll capture your leadership style, values, and executive presence here
        as we learn more from your background and examples.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 text-sm">
        {!!leadership.length && (
          <SectionWithActions
            title="Leadership philosophy"
            items={leadership}
            getText={(l) => l.statement || l.text}
            onView={setSelectedViewItem}
            onEdit={setSelectedEditItem}
            category="Leadership"
          />
        )}

        {!!presence.length && (
          <SectionWithActions
            title="Executive presence"
            items={presence}
            getText={(p) => p.statement || p.text}
            onView={setSelectedViewItem}
            onEdit={setSelectedEditItem}
            category="Executive Presence"
          />
        )}

        {!!traits.length && (
          <ChipSectionWithActions
            title="Personality & work style"
            items={traits}
            getText={(t) => t.label || t.trait}
            onView={setSelectedViewItem}
            category="Personality"
          />
        )}

        {!!workStyle.length && (
          <ChipSectionWithActions
            title="Work style"
            items={workStyle}
            getText={(w) => w.label || w.style || w.trait}
            onView={setSelectedViewItem}
            category="Work Style"
          />
        )}

        {!!values.length && (
          <ChipSectionWithActions
            title="Values & motivations"
            items={values}
            getText={(v) => v.label || v.value}
            onView={setSelectedViewItem}
            category="Values"
          />
        )}

        {!!behavioral.length && (
          <SectionWithActions
            title="Behavioral examples"
            items={behavioral}
            getText={(b) => b.description || b.text}
            onView={setSelectedViewItem}
            onEdit={setSelectedEditItem}
            category="Behavioral"
          />
        )}
      </div>

      {selectedViewItem && (
        <VaultItemViewModal
          item={{
            id: selectedViewItem.id || "",
            category: selectedViewItem._category || "Leadership & Style",
            content: {
              text: selectedViewItem.statement || selectedViewItem.text || selectedViewItem.label || selectedViewItem.trait || selectedViewItem.description,
              ...selectedViewItem,
            },
            quality_tier: selectedViewItem.quality_tier || "gold",
          }}
          open={!!selectedViewItem}
          onOpenChange={(open) => !open && setSelectedViewItem(null)}
        />
      )}

      {selectedEditItem && (
        <VaultItemEditModal
          item={{
            id: selectedEditItem.id || "",
            category: selectedEditItem._category || "Leadership & Style",
            content: {
              text: selectedEditItem.statement || selectedEditItem.text || selectedEditItem.description,
              ...selectedEditItem,
            },
            quality_tier: selectedEditItem.quality_tier || "gold",
          }}
          open={!!selectedEditItem}
          onOpenChange={(open) => !open && setSelectedEditItem(null)}
          onSave={() => {
            setSelectedEditItem(null);
          }}
        />
      )}
    </>
  );
}

function DocumentsTab({ vault }: { vault: VaultData }) {
  const rawVault: any = vault.vault || {};
  const hasResume = !!rawVault.resume_raw_text;

  if (!hasResume) {
    return (
      <p className="text-sm text-muted-foreground">
        Once you upload your resume and any project or accomplishment lists,
        we&apos;ll store them here as the single source of truth for every targeted
        resume we generate.
      </p>
    );
  }

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>
        Your resume has been analyzed and stored in your Career Vault. We&apos;ve
        captured your roles, achievements, and skills for use in resumes,
        LinkedIn, and interview preparation.
      </p>
      <p>
        You can add additional documents over time (project lists,
        accomplishment summaries, portfolio materials), and we&apos;ll incorporate
        them into your vault automatically.
      </p>
    </div>
  );
}

function SectionWithActions({
  title,
  items,
  getText,
  onView,
  onEdit,
  category,
}: {
  title: string;
  items: any[];
  getText: (item: any) => string | undefined;
  onView?: (item: any) => void;
  onEdit?: (item: any) => void;
  category: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold mb-2 uppercase text-muted-foreground flex items-center justify-between">
        <span>{title}</span>
        <span className="text-muted-foreground font-normal">{items.length} items</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const text = getText(item);
          if (!text) return null;
          return (
            <li
              key={item.id || index}
              className="flex items-start justify-between gap-3 border rounded-md px-3 py-2"
            >
              <span>• {text}</span>
              <div className="flex gap-2 shrink-0">
                {onView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => onView({ ...item, _category: category })}
                  >
                    View
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => onEdit({ ...item, _category: category })}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ChipSectionWithActions({
  title,
  items,
  getText,
  onView,
  category,
}: {
  title: string;
  items: any[];
  getText: (item: any) => string | undefined;
  onView?: (item: any) => void;
  category: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold mb-2 uppercase text-muted-foreground flex items-center justify-between">
        <span>{title}</span>
        <span className="text-muted-foreground font-normal">{items.length} items</span>
      </div>
      <ul className="flex flex-wrap gap-1">
        {items.map((item, index) => {
          const text = getText(item);
          if (!text) return null;
          return (
            <li
              key={item.id || index}
              className="text-xs rounded-full border px-2 py-1 bg-muted/40 cursor-pointer hover:bg-muted/60"
              onClick={() => onView && onView({ ...item, _category: category })}
            >
              {text}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
