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

const NAV_HEIGHT = 64;
const BG = "#06110f";
const PANEL = "#0d1b18";
const PANEL_STROKE = "#1d3b35";
const ACCENT = "#2dd4bf";
const TEXT = "#edf7f3";
const MUTED = "#91aaa1";

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
      height: height - NAV_HEIGHT,
    });

    this.sidebarPanel = new Panel({ minSize: 240, defaultSize: 0.22 });
    this.contentPanel = new Panel({ minSize: 400 });

    // 1. Sidebar items Stack
    this.sidebarStack = new Stack({ direction: "vertical", gap: 10 });
    this.sidebarStack.setPosition(18, 112);

    const addSectionBtn = (id: string, label: string) => {
      const btn = new Button(label, {
        onClick: () => this.setSection(id),
        bg: id === this.activeSection ? "rgba(45, 212, 191, 0.16)" : "#10221e",
        hoverBg:
          id === this.activeSection ? "rgba(45, 212, 191, 0.24)" : "#18332d",
        color: id === this.activeSection ? ACCENT : TEXT,
        font: "600 14px Outfit, sans-serif",
        radius: 10,
      });
      btn.width = 204;
      btn.height = 38;
      (btn as any).sectionId = id; // tag
      this.sidebarStack.add(btn);
    };

    addSectionBtn("intro", "Introduction");
    addSectionBtn("commands", "Commands");
    addSectionBtn("config", "Configuration");
    addSectionBtn("plugins", "Plugins");
    addSectionBtn("faq", "FAQ");

    this.sidebarPanel.add(this.sidebarStack);

    // 2. Content panel ScrollView + Markdown
    const contentWidth = Math.min(880, width - 360);
    this.mdRenderer = new Markdown(DOC_PAGES[this.activeSection], {
      maxWidth: contentWidth,
    });
    this.mdRenderer.setPosition(10, 10);

    this.scrollContainer = new ScrollView({
      width: contentWidth,
      height: height - NAV_HEIGHT - 48,
    });
    this.scrollContainer.setPosition(32, 28);
    this.scrollContainer.add(this.mdRenderer);

    this.contentPanel.add(this.scrollContainer);

    this.panelGroup.addPanel(this.sidebarPanel);
    this.panelGroup.addPanel(this.contentPanel);
    this.add(this.panelGroup);

    this.panelGroup.setPosition(0, NAV_HEIGHT);
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
          btn.bg = isCurrent ? "rgba(45, 212, 191, 0.16)" : "#10221e";
          btn.hoverBg = isCurrent ? "rgba(45, 212, 191, 0.24)" : "#18332d";
          btn.color = isCurrent ? ACCENT : TEXT;
        }
      }
    }
  }

  public reposition(w: number, h: number): void {
    this.width = w;
    this.height = h;

    this.panelGroup.width = w;
    this.panelGroup.height = h - NAV_HEIGHT;
    this.panelGroup.setPosition(0, NAV_HEIGHT);

    const newContentWidth = Math.min(
      880,
      Math.max(420, w - this.sidebarPanel.width - 96),
    );
    this.scrollContainer.width = newContentWidth;
    this.scrollContainer.height = h - NAV_HEIGHT - 48;

    this.mdRenderer.maxWidth = newContentWidth - 20;
    this.mdRenderer.setContent(DOC_PAGES[this.activeSection]);
    this.scrollContainer.updateContentSize();
  }

  public render(r: IRenderer): void {
    // Fill documentation background area
    r.beginPath();
    r.moveTo(0, NAV_HEIGHT);
    r.lineTo(this.width, NAV_HEIGHT);
    r.lineTo(this.width, this.height);
    r.lineTo(0, this.height);
    r.closePath();
    r.fill(BG);

    r.fillText(
      "Docs",
      32,
      NAV_HEIGHT + 38,
      "800 22px Outfit, sans-serif",
      TEXT,
    );
    r.fillText(
      "Runtime model, commands, configuration, and plugin authoring.",
      32,
      NAV_HEIGHT + 62,
      "12px JetBrains Mono, monospace",
      MUTED,
    );

    const splitX = this.sidebarPanel.width;
    r.beginPath();
    r.roundRect(16, NAV_HEIGHT + 88, splitX - 32, 310, 18);
    r.closePath();
    r.fill(PANEL);
    r.stroke(PANEL_STROKE, 1);

    r.beginPath();
    r.moveTo(splitX, NAV_HEIGHT);
    r.lineTo(splitX, this.height);
    r.closePath();
    r.stroke("rgba(45, 212, 191, 0.14)", 1);
  }
}
