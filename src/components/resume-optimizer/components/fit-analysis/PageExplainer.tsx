import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCircle, ChevronDown } from 'lucide-react';


export function PageExplainer() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors py-2">
          <HelpCircle className="h-4 w-4" />
          <span className="text-sm font-medium">How This Works</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="bg-primary/5 border-primary/20 mt-2">
                <CardContent className="p-4 text-sm space-y-3">
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">1.</span>
                    <p>We analyze the job description to identify what the employer needs (requirements).</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">2.</span>
                    <p>We scan your resume to find evidence that proves you meet those needs.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">3.</span>
                    <p>For each requirement, you can refine your resume bullet to better match the job.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">4.</span>
                    <p>Once you're a strong match, we help you become the <strong>BEST</strong> candidate using benchmark competencies.</p>
                  </div>
                  
                  <div className="pt-2 border-t border-primary/20 mt-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Recency indicators:</strong> 🟢 Recent (&lt;5 yrs) • 🟡 Dated (5-10 yrs) • 🔴 Stale (10+ yrs)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
