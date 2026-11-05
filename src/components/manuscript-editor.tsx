import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { useEffect, useRef } from "react";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Shows citation/figure tokens as readable chips while keeping the stored [[cite:id]] token stable.
const tokenKey = new PluginKey("token-labels");
function tokenLabels(get: () => Record<string, string>) {
  return Extension.create({ name: "tokenLabels", addProseMirrorPlugins: () => [new Plugin({ key: tokenKey, props: { decorations(state) {
    const decos: Decoration[] = []; const labels = get();
    state.doc.descendants((node, pos) => { if (!node.isText || !node.text) return; for (const m of node.text.matchAll(/\[\[((?:cite|fig):[^\]]+)\]\]/g)) {
      const from = pos + (m.index ?? 0), to = from + m[0].length; const label = labels[m[1] ?? ""] ?? (m[1]?.startsWith("fig") ? "Missing figure" : "Missing reference");
      decos.push(Decoration.inline(from, to, { class: "token-hidden" }), Decoration.widget(to, () => { const el = document.createElement("span"); el.className = `token-chip${labels[m[1] ?? ""] ? "" : " token-missing"}`; el.textContent = label; return el; }, { side: -1 }));
    } });
    return DecorationSet.create(state.doc, decos);
  } } })] });
}
import { Bold, Italic, Undo2, Redo2, List, Table2, Heading2, Sigma, Superscript as SupIcon, Subscript as SubIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ManuscriptEditor({ html, onChange, insertion, onInserted, labels = {} }: { labels?: Record<string, string>; html: string; onChange: (html: string) => void; insertion: string; onInserted: () => void }) {
  const labelsRef = useRef(labels); labelsRef.current = labels;
  const editor = useEditor({ extensions: [StarterKit, TableKit, Superscript, Subscript, tokenLabels(() => labelsRef.current)], content: html, immediatelyRender: false, onUpdate: ({ editor }) => onChange(editor.getHTML()), editorProps: { attributes: { class: "manuscript-prose min-h-[440px] outline-none", "aria-label": "Section content" } } });
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