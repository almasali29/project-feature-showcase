import { useEffect, useState } from "react";
import { PenLine, BookOpen, ChartColumn, LayoutTemplate, ShieldCheck, Send, ArrowRight, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
const steps = [
  { title: "Start with your paper", Icon: PenLine, text: "Choose a section and write in the centre, or use “Paste full paper” to bring in an existing draft with its references. Use the toolbar for headings, alignment, tables and equations. Changes save automatically; wait for Saved before leaving.", tab: "Writing" },
  { title: "Build your reference library", Icon: BookOpen, text: "Add each source in References. Enter authors as Surname, Given name; separate authors with semicolons. Return to Writing to insert the source into your current section.", tab: "References" },
  { title: "Add figures and results", Icon: ChartColumn, text: "Upload a figure image or a photo of a table, give it a title and choose the section it goes after. Numbers and captions follow your venue (e.g. IEEE “Fig. 1”, “TABLE I”). Use “Mention in text” to cite it.", tab: "Figures" },
  { title: "Choose your formatting", Icon: LayoutTemplate, text: "Select your venue, enter author details and adjust its starting rules to your exact journal or conference instructions. Preview updates live. PDF uses your browser’s Save as PDF; Word exports text and tables.", tab: "Formatting" },
  { title: "Review every finding", Icon: ShieldCheck, text: "Checks show citation, structure and metadata errors first. Request an AI review for contextual claim and reproducibility feedback; saved text is sent to Lovable AI. All AI findings are potential issues, never scientific verdicts.", tab: "Integrity" },
  { title: "Prepare for submission", Icon: Send, text: "Readiness groups blockers and warnings. Fix blockers; review or acknowledge warnings. Download the report and inspect your exported paper against the publisher’s instructions. This score is not acceptance or formatting certification.", tab: "Readiness" },
];
export function WorkspaceGuide({ userId, onTab }: { userId: string; onTab: (tab: string) => void }) {
  const [open, setOpen] = useState(false); const [step, setStep] = useState(0);
  useEffect(() => { try { setOpen(!localStorage.getItem(`workspace-guide-v1:${userId}`)); } catch { setOpen(true); } }, [userId]);
  const close = (value: boolean) => { setOpen(value); if (!value) { try { localStorage.setItem(`workspace-guide-v1:${userId}`, "seen"); } catch { /* guidance remains accessible */ } } };
  const current = steps[step]; if (!current) return null;
  return <><Button variant="outline" title="Workspace guide" onClick={() => { setStep(0); setOpen(true); }}><CircleHelp /> Guide</Button><Dialog open={open} onOpenChange={close}><DialogContent className="max-w-lg"><current.Icon className="h-10 w-10 text-primary" /><p className="text-xs uppercase text-muted-foreground">Workspace guide · {step + 1} of {steps.length}</p><DialogTitle className="font-serif text-3xl">{current.title}</DialogTitle><DialogDescription className="text-base leading-relaxed">{current.text}</DialogDescription><div className="mt-4 flex flex-wrap justify-between gap-2"><Button variant="ghost" onClick={() => { onTab(current.tab); close(false); }}>Open {current.tab}</Button><Button onClick={() => step < steps.length - 1 ? setStep(step + 1) : close(false)}>{step === steps.length - 1 ? "Start writing" : "Next"}<ArrowRight /></Button></div></DialogContent></Dialog></>;
}