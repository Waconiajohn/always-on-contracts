import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, FileText } from "lucide-react";
import { NavigateFunction } from "react-router-dom";

interface ContractToolsCardsProps {
  navigate: NavigateFunction;
}

export const ContractToolsCards = ({ navigate }: ContractToolsCardsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Rate Calculator</CardTitle>
          </div>
          <CardDescription>
            Calculate your optimal contract rate based on your full-time salary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/rate-calculator")} className="w-full">
            Open Calculator
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Contract Templates</CardTitle>
          </div>
          <CardDescription>
            Access professional contract templates and agreements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/templates")} variant="outline" className="w-full">
            View Templates
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
