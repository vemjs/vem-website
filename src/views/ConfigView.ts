import {
  UIComponent,
  Stack,
  Checkbox,
  Text,
  Button,
  Card,
  Input,
} from "@vectojs/ui";
import type { IRenderer } from "@vectojs/core";

const NAV_HEIGHT = 64;
const BG = "#06110f";
const PANEL = "#0d1b18";
const PANEL_STROKE = "#1d3b35";
const ACCENT = "#2dd4bf";
const TEXT = "#edf7f3";
const MUTED = "#91aaa1";

interface KeybindingRow {
  mode: string;
  keys: string;
  command: string;
  keysInput: Input;
  cmdInput: Input;
  delBtn: Button;
  container: Stack;
}

export class ConfigView extends UIComponent {
  private configStack: Stack;
  private keymapsStack: Stack;
  private livePreviewCard: Card;
  private previewText: Text;
  private copyBtn: Button;

  // Configuration State
  private relativeNumbers = true;
  private trimWhitespace = true;
  private lspSync = true;
  private keybindings: KeybindingRow[] = [];

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;

    // 1. General Config Settings Stack (Left Column)
    this.configStack = new Stack({ direction: "vertical", gap: 15 });
    this.configStack.setPosition(50, 80);

    const titleEl = new Text("Visual Configuration Builder", {
      font: "bold 24px Outfit, sans-serif",
      color: TEXT,
    });
    this.configStack.add(titleEl);

    const subEl = new Text(
      "Build your custom .vemrc.json editor settings dynamically.",
      {
        font: "14px Outfit, sans-serif",
        color: MUTED,
      },
    );
    this.configStack.add(subEl);

    // Toggles
    const relNumCheckbox = new Checkbox({
      label: "Enable relative line numbers (relativenumber)",
      checked: this.relativeNumbers,
      font: "14px monospace",
      color: TEXT,
      onChange: (v) => {
        this.relativeNumbers = v;
        this.updatePreview();
      },
    });

    const trimCheckbox = new Checkbox({
      label: "Trim trailing whitespace on save",
      checked: this.trimWhitespace,
      font: "14px monospace",
      color: TEXT,
      onChange: (v) => {
        this.trimWhitespace = v;
        this.updatePreview();
      },
    });

    const lspCheckbox = new Checkbox({
      label: "Native LSP client automatic synchronization",
      checked: this.lspSync,
      font: "14px monospace",
      color: TEXT,
      onChange: (v) => {
        this.lspSync = v;
        this.updatePreview();
      },
    });

    this.configStack.add(relNumCheckbox);
    this.configStack.add(trimCheckbox);
    this.configStack.add(lspCheckbox);

    // Keybindings Header
    const keymapTitle = new Text("Custom Keymaps (Chords)", {
      font: "bold 18px Outfit, sans-serif",
      color: TEXT,
    });
    this.configStack.add(keymapTitle);

    // Keybindings stack container
    this.keymapsStack = new Stack({ direction: "vertical", gap: 10 });
    this.configStack.add(this.keymapsStack);

    // Add Binding Button
    const addBtn = new Button("+ Add Keybinding", {
      onClick: () => this.addKeybindingRow("NORMAL", "", ""),
      bg: "#10221e",
      hoverBg: "#18332d",
      color: ACCENT,
      font: "600 14px Outfit, sans-serif",
      radius: 6,
    });
    addBtn.width = 150;
    addBtn.height = 36;
    this.configStack.add(addBtn);

    // 2. Live JSON Preview Panel (Right Column)
    this.livePreviewCard = new Card({
      width: 400,
      height: 420,
      bg: PANEL,
      border: PANEL_STROKE,
      radius: 16,
      padding: 15,
    });
    this.livePreviewCard.setPosition(width - 450, 80);

    const previewTitle = new Text(".vemrc.json", {
      font: "bold 14px JetBrains Mono, monospace",
      color: MUTED,
    }).setPosition(15, 15);
    this.livePreviewCard.add(previewTitle);

    this.previewText = new Text("", {
      font: "13px JetBrains Mono, monospace",
      color: ACCENT,
      lineHeight: 20,
      maxWidth: 360,
    }).setPosition(15, 45);
    this.livePreviewCard.add(this.previewText);

    // Copy Button
    this.copyBtn = new Button("Copy Configuration", {
      onClick: () => this.copyToClipboard(),
      bg: "#0f766e",
      hoverBg: "#14b8a6",
      color: "#ecfeff",
      font: "600 14px Outfit, sans-serif",
      radius: 8,
    });
    this.copyBtn.width = 180;
    this.copyBtn.height = 40;
    this.copyBtn.setPosition(width - 450, 520);

    this.add(this.configStack);
    this.add(this.livePreviewCard);
    this.add(this.copyBtn);

    this.addKeybindingRow("NORMAL", "jk", "editor.escape");
    this.updatePreview();
  }

  private addKeybindingRow(mode: string, keys: string, command: string): void {
    const keysInput = new Input({
      width: 120,
      height: 32,
      placeholder: "keys (e.g. jk)",
      value: keys,
      font: "13px monospace",
      onChange: (v) => {
        const row = this.keybindings.find((r) => r.keysInput === keysInput);
        if (row) {
          row.keys = v;
          this.updatePreview();
        }
      },
    });

    const cmdInput = new Input({
      width: 180,
      height: 32,
      placeholder: "command (e.g. editor.escape)",
      value: command,
      font: "13px monospace",
      onChange: (v) => {
        const row = this.keybindings.find((r) => r.cmdInput === cmdInput);
        if (row) {
          row.command = v;
          this.updatePreview();
        }
      },
    });

    const delBtn = new Button("Delete", {
      onClick: () => this.removeKeybindingRow(keysInput),
      bg: "#b42318",
      hoverBg: "#dc2626",
      color: "#ffffff",
      font: "bold 12px sans-serif",
      radius: 4,
    });
    delBtn.width = 64;
    delBtn.height = 32;

    const rowContainer = new Stack({ direction: "horizontal", gap: 10 });
    rowContainer.add(keysInput);
    rowContainer.add(cmdInput);
    rowContainer.add(delBtn);

    this.keymapsStack.add(rowContainer);

    this.keybindings.push({
      mode,
      keys,
      command,
      keysInput,
      cmdInput,
      delBtn,
      container: rowContainer,
    });

    this.configStack.layout();
    this.updatePreview();
  }

  private removeKeybindingRow(keysInput: Input): void {
    const idx = this.keybindings.findIndex((r) => r.keysInput === keysInput);
    if (idx !== -1) {
      const row = this.keybindings[idx];
      this.scene?.detachA11y(row.container);
      this.keymapsStack.remove(row.container);
      this.keybindings.splice(idx, 1);
      this.configStack.layout();
      this.updatePreview();
    }
  }

  private getJsonContent(): string {
    const configObj = {
      relativenumber: this.relativeNumbers,
      trimTrailingWhitespace: this.trimWhitespace,
      lspSync: this.lspSync,
      keybindings: this.keybindings
        .filter((r) => r.keys.trim() !== "" && r.command.trim() !== "")
        .map((r) => ({
          mode: r.mode,
          keys: r.keys,
          command: r.command,
        })),
    };
    return JSON.stringify(configObj, null, 2);
  }

  private updatePreview(): void {
    this.previewText.setText(this.getJsonContent());
  }

  private copyToClipboard(): void {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(this.getJsonContent());
      this.copyBtn.label = "Copied!";
      setTimeout(() => {
        this.copyBtn.label = "Copy Configuration";
      }, 1500);
    }
  }

  public reposition(w: number, h: number): void {
    this.width = w;
    this.height = h;

    const margin = w < 720 ? 24 : 50;
    const twoColumn = w >= 1040;
    const previewWidth = twoColumn
      ? Math.min(430, Math.max(360, w * 0.32))
      : Math.max(320, w - margin * 2);
    const previewHeight = twoColumn ? Math.min(420, h - NAV_HEIGHT - 180) : 300;
    const formWidth = twoColumn
      ? w - previewWidth - margin * 3
      : w - margin * 2;

    for (const row of this.keybindings) {
      const compactRow = formWidth < 470;
      row.container.direction = compactRow ? "vertical" : "horizontal";
      row.keysInput.width = compactRow ? Math.min(220, formWidth) : 120;
      row.cmdInput.width = compactRow
        ? Math.min(320, formWidth)
        : Math.min(220, Math.max(180, formWidth - 214));
      row.delBtn.width = compactRow ? 96 : 64;
      row.container.layout();
    }

    this.configStack.setPosition(margin, NAV_HEIGHT + 36);
    this.configStack.layout();

    this.livePreviewCard.width = previewWidth;
    this.livePreviewCard.height = previewHeight;
    this.previewText.setMaxWidth(previewWidth - 40);

    const previewX = twoColumn ? w - previewWidth - margin : margin;
    const previewY = twoColumn
      ? NAV_HEIGHT + 40
      : Math.min(h - previewHeight - 86, NAV_HEIGHT + 360);
    this.livePreviewCard.setPosition(
      previewX,
      Math.max(NAV_HEIGHT + 40, previewY),
    );
    this.copyBtn.width = Math.min(220, previewWidth);
    this.copyBtn.setPosition(
      previewX,
      this.livePreviewCard.y + previewHeight + 24,
    );
  }

  public render(r: IRenderer): void {
    // Fill background area
    r.beginPath();
    r.moveTo(0, NAV_HEIGHT);
    r.lineTo(this.width, NAV_HEIGHT);
    r.lineTo(this.width, this.height);
    r.lineTo(0, this.height);
    r.closePath();
    r.fill(BG);

    r.beginPath();
    r.roundRect(32, NAV_HEIGHT + 24, Math.min(520, this.width - 64), 72, 18);
    r.closePath();
    r.fill("rgba(45, 212, 191, 0.055)");
    r.stroke("rgba(45, 212, 191, 0.14)", 1);
  }
}
