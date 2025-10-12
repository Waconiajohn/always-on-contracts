import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BooleanSearchBuilder = () => {
  const { toast } = useToast();
  const [mustHave, setMustHave] = useState<string[]>([]);
  const [shouldHave, setShouldHave] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [newMust, setNewMust] = useState("");
  const [newShould, setNewShould] = useState("");
  const [newExclude, setNewExclude] = useState("");

  const buildLinkedInSearch = () => {
    const mustTerms = mustHave.join(" AND ");
    const shouldTerms = shouldHave.length > 0 ? ` OR ${shouldHave.join(" OR ")}` : "";
    const excludeTerms = exclude.length > 0 ? ` NOT ${exclude.join(" NOT ")}` : "";
    return `${mustTerms}${shouldTerms}${excludeTerms}`;
  };

  const buildIndeedSearch = () => {
    const mustTerms = mustHave.map(term => `"${term}"`).join(" ");
    const shouldTerms = shouldHave.length > 0 ? ` ${shouldHave.join(" OR ")}` : "";
    const excludeTerms = exclude.length > 0 ? ` -${exclude.join(" -")}` : "";
    return `${mustTerms}${shouldTerms}${excludeTerms}`;
  };

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${platform} search string copied to clipboard`,
    });
  };

  const addMust = () => {
    if (newMust.trim() && !mustHave.includes(newMust.trim())) {
      setMustHave([...mustHave, newMust.trim()]);
      setNewMust("");
    }
  };

  const addShould = () => {
    if (newShould.trim() && !shouldHave.includes(newShould.trim())) {
      setShouldHave([...shouldHave, newShould.trim()]);
      setNewShould("");
    }
  };

  const addExclude = () => {
    if (newExclude.trim() && !exclude.includes(newExclude.trim())) {
      setExclude([...exclude, newExclude.trim()]);
      setNewExclude("");
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Boolean Search Builder
        </CardTitle>
        <CardDescription>
          Create optimized search strings for LinkedIn and Indeed job boards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Must Have Terms */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Must Have (AND)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Project Manager, Scrum"
              value={newMust}
              onChange={(e) => setNewMust(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addMust()}
            />
            <Button size="sm" onClick={addMust}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {mustHave.map((term) => (
              <Badge
                key={term}
                variant="default"
                className="cursor-pointer hover:bg-destructive"
                onClick={() => setMustHave(mustHave.filter((t) => t !== term))}
              >
                {term} <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>

        {/* Should Have Terms */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Should Have (OR)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Agile, Kanban"
              value={newShould}
              onChange={(e) => setNewShould(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addShould()}
            />
            <Button size="sm" onClick={addShould}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {shouldHave.map((term) => (
              <Badge
                key={term}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive"
                onClick={() => setShouldHave(shouldHave.filter((t) => t !== term))}
              >
                {term} <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>

        {/* Exclude Terms */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Exclude (NOT)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., entry-level, intern"
              value={newExclude}
              onChange={(e) => setNewExclude(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addExclude()}
            />
            <Button size="sm" onClick={addExclude}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {exclude.map((term) => (
              <Badge
                key={term}
                variant="outline"
                className="cursor-pointer hover:bg-destructive"
                onClick={() => setExclude(exclude.filter((t) => t !== term))}
              >
                {term} <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>

        {/* Generated Searches */}
        {mustHave.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="font-semibold">LinkedIn Search String</Label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {buildLinkedInSearch()}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(buildLinkedInSearch(), "LinkedIn")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Indeed Search String</Label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {buildIndeedSearch()}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(buildIndeedSearch(), "Indeed")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};