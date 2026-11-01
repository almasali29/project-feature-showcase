import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { useEffect } from "react";
import { Bold, Italic, Undo2, Redo2, List, Table2, Heading2, Sigma, Superscript as SupIcon, Subscript as SubIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ManuscriptEditor({ html, onChange, insertion, onInserted }: { html: string; onChange: (html: string) => void; insertion: string; onInserted: () => void }) {
  const editor = useEditor({ extensions: [StarterKit, TableKit, Superscript, Subscript], content: html, immediatelyRender: false, onUpdate: ({ editor }) => onChange(editor.getHTML()), editorProps: { attributes: { class: "manuscript-prose min-h-[440px] outline-none", "aria-label": "Section content" } } });
  useEffect(() => { if (editor && html !== editor.getHTML()) editor.commands.setContent(html, { emitUpdate: false }); }, [editor, html]);
  useEffect(() => { if (editor && insertion) { editor.chain().focus().insertContent(insertion).run(); onInserted(); } }, [editor, insertion, onInserted]);
  const tools = [
    { label: "Bold", Icon: Bold, run: () => editor?.chain().focus().toggleBold().run() },
    { label: "Italic", Icon: Italic, run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Heading", Icon: Heading2, run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Bullet list", Icon: List, run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Insert table", Icon: Table2, run: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: "Superscript", Icon: SupIcon, run: () => editor?.chain().focus().toggleSuperscript().run() },
    { label: "Subscript", Icon: SubIcon, run: () => editor?.chain().focus().toggleSubscript().run() },
    { label: "Insert equation", Icon: Sigma, run: () => { const value = prompt("Equation in TeX notation, for example E = mc^2"); if (value) editor?.chain().focus().insertContent(` $$${value.replace(/[<>]/g, "")}$$ `).run(); } },
    { label: "Undo", Icon: Undo2, run: () => editor?.chain().focus().undo().run() },
    { label: "Redo", Icon: Redo2, run: () => editor?.chain().focus().redo().run() },
  ];
  return <div><div className="flex flex-wrap gap-1 border-y border-border py-2">{tools.map(({ label, Icon, run }) => <Button key={label} variant="ghost" size="icon" title={label} aria-label={label} onClick={run}><Icon /></Button>)}</div><div className="py-6"><EditorContent editor={editor} /></div></div>;
}