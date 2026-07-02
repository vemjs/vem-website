import { UIComponent, Stack, Checkbox, Text, Button, Card, Input } from '@vectojs/ui';
import type { IRenderer } from '@vectojs/core';

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
    this.configStack = new Stack({ direction: 'vertical', gap: 15 });
    this.configStack.setPosition(50, 80);

    const titleEl = new Text('Visual Configuration Builder', {
      font: 'bold 24px Outfit, sans-serif',
      color: '#ffffff',
    });
    this.configStack.add(titleEl);

    const subEl = new Text('Build your custom .vemrc.json editor settings dynamically.', {
      font: '14px Outfit, sans-serif',
      color: '#94a3b8',
    });
    this.configStack.add(subEl);

    // Toggles
    const relNumCheckbox = new Checkbox({
      label: 'Enable relative line numbers (relativenumber)',
      checked: this.relativeNumbers,
      font: '14px monospace',
      color: '#cbd5e1',
      onChange: (v) => {
        this.relativeNumbers = v;
        this.updatePreview();
      },
    });

    const trimCheckbox = new Checkbox({
      label: 'Trim trailing whitespace on save',
      checked: this.trimWhitespace,
      font: '14px monospace',
      color: '#cbd5e1',
      onChange: (v) => {
        this.trimWhitespace = v;
        this.updatePreview();
      },
    });

    const lspCheckbox = new Checkbox({
      label: 'Native LSP client automatic synchronization',
      checked: this.lspSync,
      font: '14px monospace',
      color: '#cbd5e1',
      onChange: (v) => {
        this.lspSync = v;
        this.updatePreview();
      },
    });

    this.configStack.add(relNumCheckbox);
    this.configStack.add(trimCheckbox);
    this.configStack.add(lspCheckbox);

    // Keybindings Header
    const keymapTitle = new Text('Custom Keymaps (Chords)', {
      font: 'bold 18px Outfit, sans-serif',
      color: '#ffffff',
    });
    this.configStack.add(keymapTitle);

    // Keybindings stack container
    this.keymapsStack = new Stack({ direction: 'vertical', gap: 10 });
    this.configStack.add(this.keymapsStack);

    // Add Binding Button
    const addBtn = new Button('+ Add Keybinding', {
      onClick: () => this.addKeybindingRow('NORMAL', '', ''),
      bg: '#1e293b',
      hoverBg: '#334155',
      color: '#38bdf8', // sky-400
      font: '600 14px Outfit, sans-serif',
      radius: 6,
    });
    addBtn.width = 150;
    addBtn.height = 36;
    this.configStack.add(addBtn);

    // Add initial default row
    this.addKeybindingRow('NORMAL', 'jk', 'editor.escape');

    // 2. Live JSON Preview Panel (Right Column)
    this.livePreviewCard = new Card({
      width: 400,
      height: 420,
      bg: '#0f172a', // slate-900
      border: '#334155',
      radius: 12,
      padding: 15,
    });
    this.livePreviewCard.setPosition(width - 450, 80);

    const previewTitle = new Text('.vemrc.json', {
      font: 'bold 14px JetBrains Mono, monospace',
      color: '#64748b',
    }).setPosition(15, 15);
    this.livePreviewCard.add(previewTitle);

    this.previewText = new Text('', {
      font: '13px JetBrains Mono, monospace',
      color: '#38bdf8', // sky-400
      lineHeight: 20,
    }).setPosition(15, 45);
    this.livePreviewCard.add(this.previewText);

    // Copy Button
    this.copyBtn = new Button('Copy Configuration', {
      onClick: () => this.copyToClipboard(),
      bg: '#8b5cf6', // violet-500
      hoverBg: '#a78bfa',
      color: '#ffffff',
      font: '600 14px Outfit, sans-serif',
      radius: 8,
    });
    this.copyBtn.width = 180;
    this.copyBtn.height = 40;
    this.copyBtn.setPosition(width - 450, 520);

    this.add(this.configStack);
    this.add(this.livePreviewCard);
    this.add(this.copyBtn);

    this.updatePreview();
  }

  private addKeybindingRow(mode: string, keys: string, command: string): void {
    const keysInput = new Input({
      width: 120,
      height: 32,
      placeholder: 'keys (e.g. jk)',
      value: keys,
      font: '13px monospace',
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
      placeholder: 'command (e.g. editor.escape)',
      value: command,
      font: '13px monospace',
      onChange: (v) => {
        const row = this.keybindings.find((r) => r.cmdInput === cmdInput);
        if (row) {
          row.command = v;
          this.updatePreview();
        }
      },
    });

    const delBtn = new Button('✕', {
      onClick: () => this.removeKeybindingRow(keysInput),
      bg: '#ef4444',
      hoverBg: '#f87171',
      color: '#ffffff',
      font: 'bold 12px sans-serif',
      radius: 4,
    });
    delBtn.width = 32;
    delBtn.height = 32;

    const rowContainer = new Stack({ direction: 'horizontal', gap: 10 });
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
        .filter((r) => r.keys.trim() !== '' && r.command.trim() !== '')
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
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.getJsonContent());
      this.copyBtn.label = 'Copied!';
      setTimeout(() => {
        this.copyBtn.label = 'Copy Configuration';
      }, 1500);
    }
  }

  public reposition(w: number, h: number): void {
    this.width = w;
    this.height = h;

    this.configStack.setPosition(50, 80);
    this.configStack.layout();

    this.livePreviewCard.setPosition(Math.max(450, w - 450), 80);
    this.copyBtn.setPosition(Math.max(450, w - 450), 520);
  }

  public render(r: IRenderer): void {
    // Fill background area
    r.beginPath();
    r.moveTo(0, 50);
    r.lineTo(this.width, 50);
    r.lineTo(this.width, this.height);
    r.lineTo(0, this.height);
    r.closePath();
    r.fill('#0b0f19');
  }
}
