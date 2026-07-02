import {
  UIComponent,
  PanelGroup,
  Panel,
  ScrollView,
  Markdown,
  Button,
  Stack,
} from "@vectojs/ui";
import type { IRenderer } from "@vectojs/core";

const DOC_PAGES: Record<string, string> = {
  intro: `# Introduction to Vem

Vem is a **next-generation modal text editor** designed to challenge the limits of traditional terminal-bound grid cells. 

### Why Canvas 2D instead of DOM?

Traditional editors like VS Code (Monaco) use DOM trees with thousands of \`<span>\` elements. This leads to:
- Layout recalculations and rendering pipeline stalls
- DOM nodes pollution
- High memory usage

Vem renders **every glyph, caret, gutter line, selection, and status bar** straight to WebGL Canvas pixels. Zero DOM overhead in the text editing zone.

### Features
- **Native Vim motions**: \`w\`, \`b\`, \`gg\`, \`G\`, \`dw\`, \`ciw\`, visual character/line/block select.
- **LSP sync**: Automatic \`didOpen\`/ \`didChange\` sync to local or WebSocket language servers.
- **100% Extensible**: Standard plugin APIs built on TypeScript ESM modules.
`,

  commands: `# Commands Reference

Vem supports a standard subset of Vim Ex-commands in the **COMMAND mode** (activated by pressing \`:\`).

### Layout Splits
- \`:vsp\` - Vertical split. Splits the active editor panel into left and right panes.
- \`:sp\` - Horizontal split. Splits the active editor panel into top and bottom panes.
- \`:q\` - Close active pane. Exits split layout if it is the last pane.

### File Operations
- \`:w\` - Write (save) buffer content.
- \`:e <filepath>\` - Open a file inside the active tab.

### Diagnostics
- \`:next\` / \`:prev\` - Jump between LSP diagnostics errors.
`,

  config: `# Configuration Guide

Vem is configured using a simple declarative JSON object or a dynamic JS/TS module (\`.vemrc.json\` or \`.vemrc.js\`).

### Example Config: \`.vemrc.json\`

\`\`\`json
{
  "keybindings": [
    { "mode": "NORMAL", "keys": "jk", "command": "editor.escape" },
    { "mode": "NORMAL", "keys": "<Space>w", "command": "buffer.save" }
  ]
}
\`\`\`

### Evaluating local config
When opening a folder workspace inside the Vem Explorer, it automatically detects any root-level \`.vemrc\` configuration and compiles it on the fly.
`,

  plugins: `# Plugin Development Tutorial

Build official or third-party extensions using \`@vemjs/plugin-api\`.

### Basic Lifecycle
Plugins implement the \`VemPlugin\` interface, exposing \`activate(context)\` and \`deactivate()\`:

\`\`\`typescript
import { type VemPlugin } from '@vemjs/plugin-api';

export const TrimWhitespacePlugin: VemPlugin = {
  name: 'trim-whitespace',
  version: '1.0.0',
  activate(context) {
    context.onDidChangeBuffer(() => {
      const editor = context.editorState;
      const original = editor.getText();
      const trimmed = original.split('\\n').map(l => l.trimEnd()).join('\\n');
      if (trimmed !== original) {
        editor.getBuffer().setText(trimmed);
      }
    });
  }
};
\`\`\`
`,

  faq: `# Architectural FAQ

### Q: Does Vem run inside Neovim?
No. Vem is a standalone, pure TypeScript Vim emulator state machine. It parses Vim keyboard shortcuts and motions independently.

### Q: Can I run language servers locally?
Yes! \`@vemjs/lsp-client\` supports standard JSON-RPC 2.0. By using a local WebSocket socket proxy, you can connect to standard servers (like \`typescript-language-server\`, \`gopls\`, \`pyright\`).

### Q: Is there a desktop client?
Yes. We have Tauri integrations planned to compile native binaries running directly on Windows, macOS, and Linux conforming to standard XDG config directories.
`,
};

export class DocsView extends UIComponent {
  private panelGroup: PanelGroup;
  private sidebarPanel: Panel;
  private contentPanel: Panel;
  private scrollContainer: ScrollView;
  private mdRenderer: Markdown;
  private sidebarStack: Stack;

  private activeSection = "intro";

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;

    this.panelGroup = new PanelGroup({
      direction: "horizontal",
      width: width,
      height: height - 50, // reserve space for header offset
    });

    this.sidebarPanel = new Panel({ minSize: 200, defaultSize: 0.25 });
    this.contentPanel = new Panel({ minSize: 400 });

    // 1. Sidebar items Stack
    this.sidebarStack = new Stack({ direction: "vertical", gap: 10 });
    this.sidebarStack.setPosition(15, 20);

    const addSectionBtn = (id: string, label: string) => {
      const btn = new Button(label, {
        onClick: () => this.setSection(id),
        bg: id === this.activeSection ? "#8b5cf6" : "#1e293b",
        hoverBg: id === this.activeSection ? "#a78bfa" : "#334155",
        color: "#ffffff",
        font: "600 14px Outfit, sans-serif",
        radius: 6,
      });
      btn.width = 180;
      btn.height = 36;
      (btn as any).sectionId = id; // tag
      this.sidebarStack.add(btn);
    };

    addSectionBtn("intro", "📚 Introduction");
    addSectionBtn("commands", "⌨️ Commands");
    addSectionBtn("config", "🎛️ Configuration");
    addSectionBtn("plugins", "🔌 Plugins");
    addSectionBtn("faq", "💬 FAQ");

    this.sidebarPanel.add(this.sidebarStack);

    // 2. Content panel ScrollView + Markdown
    const contentWidth = width * 0.75 - 40;
    this.mdRenderer = new Markdown(DOC_PAGES[this.activeSection], {
      maxWidth: contentWidth,
    });
    this.mdRenderer.setPosition(10, 10);

    this.scrollContainer = new ScrollView({
      width: contentWidth,
      height: height - 90,
    });
    this.scrollContainer.setPosition(20, 20);
    this.scrollContainer.add(this.mdRenderer);

    this.contentPanel.add(this.scrollContainer);

    this.panelGroup.addPanel(this.sidebarPanel);
    this.panelGroup.addPanel(this.contentPanel);
    this.add(this.panelGroup);

    this.panelGroup.setPosition(0, 50);
  }

  public setSection(sectionId: string): void {
    if (DOC_PAGES[sectionId]) {
      this.activeSection = sectionId;
      this.mdRenderer.setContent(DOC_PAGES[sectionId]);

      // Update sidebar buttons highlight state
      const buttons = this.sidebarStack.children;
      for (const btn of buttons) {
        if (btn instanceof Button) {
          const isCurrent = (btn as any).sectionId === sectionId;
          btn.bg = isCurrent ? "#8b5cf6" : "#1e293b";
          btn.hoverBg = isCurrent ? "#a78bfa" : "#334155";
        }
      }
    }
  }

  public reposition(w: number, h: number): void {
    this.width = w;
    this.height = h;

    this.panelGroup.width = w;
    this.panelGroup.height = h - 50;
    this.panelGroup.setPosition(0, 50);

    const newContentWidth = this.contentPanel.width - 40;
    this.scrollContainer.width = newContentWidth;
    this.scrollContainer.height = h - 90;

    this.mdRenderer.maxWidth = newContentWidth - 20;
  }

  public render(r: IRenderer): void {
    // Fill documentation background area
    r.beginPath();
    r.moveTo(0, 50);
    r.lineTo(this.width, 50);
    r.lineTo(this.width, this.height);
    r.lineTo(0, this.height);
    r.closePath();
    r.fill("#0b0f19"); // matching background slate

    // Gutter border separating sidebar and content
    const splitX = this.sidebarPanel.width;
    r.beginPath();
    r.moveTo(splitX, 50);
    r.lineTo(splitX, this.height);
    r.closePath();
    r.stroke("#1f2937", 1);
  }
}
