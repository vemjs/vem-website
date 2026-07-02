import { UIComponent, Text, Button, Card, Flow, Link } from "@vectojs/ui";
import type { IRenderer } from "@vectojs/core";

export class HomeView extends UIComponent {
  private titleText: Text;
  private subtitleText: Text;
  private primaryBtn: Button;
  private secondaryBtn: Button;
  private cardsFlow: Flow;

  private particleCount = 20;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }> = [];

  constructor(
    width: number,
    height: number,
    onLaunch: () => void,
    onViewDocs: () => void,
    onViewConfig: () => void,
  ) {
    super();
    this.width = width;
    this.height = height;

    // 1. Particle background simulation
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    // 2. Title Text
    this.titleText = new Text("The Vim and Neovim,\nUnbound from TTY.", {
      font: "bold 48px Outfit, sans-serif",
      color: "#ffffff",
      maxWidth: 800,
      lineHeight: 60,
    });

    // 3. Subtitle Text
    this.subtitleText = new Text(
      "A modal editing engine rendered natively in GPU canvas pixels. Escape the fixed-character terminal grid. Embed charts, custom UI popups, inline SVG, and beautiful variable-font typesetting. Powered by VectoUI.",
      {
        font: "16px Outfit, sans-serif",
        color: "#94a3b8",
        maxWidth: 700,
        lineHeight: 24,
      },
    );

    // 4. CTA Buttons
    this.primaryBtn = new Button("Launch Editor", {
      onClick: onLaunch,
      bg: "#8b5cf6", // violet-500
      hoverBg: "#a78bfa", // violet-400
      color: "#ffffff",
      font: "600 16px Outfit, sans-serif",
      radius: 8,
    });
    this.primaryBtn.width = 160;
    this.primaryBtn.height = 45;

    this.secondaryBtn = new Button("GitHub Repository", {
      onClick: () =>
        window.open("https://github.com/vemjs/vem", "_blank", "noopener"),
      bg: "#1e293b", // slate-800
      hoverBg: "#334155",
      color: "#ffffff",
      font: "600 16px Outfit, sans-serif",
      radius: 8,
    });
    this.secondaryBtn.width = 180;
    this.secondaryBtn.height = 45;

    // 5. Feature cards flow layout
    this.cardsFlow = new Flow({ gap: 20, maxWidth: 850 });

    const cardDocs = this.createFeatureCard(
      "📚 Documentation",
      "Guides, configurations, API specifications for plugins, and standard shortcuts.",
      "Explore Docs →",
      onViewDocs,
    );

    const cardFAQ = this.createFeatureCard(
      "💬 Architectural FAQ",
      "Detailed insights on how Vem bypasses traditional Neovim limitations and embeds inline rich-canvas structures.",
      "Read FAQ →",
      onViewDocs, // goes to FAQ section of docs
    );

    const cardConfig = this.createFeatureCard(
      "🎛️ Visual Configurator",
      "Generate your .vemrc.json dynamically via an interactive graphical builder. Export in one click.",
      "Open Config Builder →",
      onViewConfig,
    );

    const cardPlugins = this.createFeatureCard(
      "🔌 Plugin Marketplace",
      "Browse verified packages or upload your own plugin to register custom keybindings and hooks.",
      "Coming Soon",
      () => {},
    );

    this.cardsFlow.add(cardDocs);
    this.cardsFlow.add(cardFAQ);
    this.cardsFlow.add(cardConfig);
    this.cardsFlow.add(cardPlugins);

    this.add(this.titleText);
    this.add(this.subtitleText);
    this.add(this.primaryBtn);
    this.add(this.secondaryBtn);
    this.add(this.cardsFlow);

    this.reposition(width, height);
  }

  private createFeatureCard(
    title: string,
    body: string,
    linkText: string,
    onClick: () => void,
  ): Card {
    const card = new Card({
      width: 400,
      height: 180,
      bg: "#111827", // grey-900
      border: "#1f2937", // grey-800
      radius: 12,
      padding: 20,
    });

    const titleEl = new Text(title, {
      font: "bold 18px Outfit, sans-serif",
      color: "#ffffff",
    }).setPosition(20, 20);

    const bodyEl = new Text(body, {
      font: "14px Outfit, sans-serif",
      color: "#9ca3af",
      maxWidth: 360,
      lineHeight: 20,
    }).setPosition(20, 50);

    const linkEl = new Link(linkText, {
      href: "#",
      color: "#a78bfa",
      font: "600 14px Outfit, sans-serif",
      underline: false,
    }).setPosition(20, 140);

    // Make the link clickable by hooking a button-like overlay if needed, or link component
    // Let's hook a button over the card area for direct interaction
    const clickOverlay = new Button("", {
      onClick,
      bg: "transparent",
      hoverBg: "rgba(255, 255, 255, 0.02)",
      radius: 12,
    });
    clickOverlay.width = 400;
    clickOverlay.height = 180;
    clickOverlay.setPosition(0, 0);

    card.add(titleEl);
    card.add(bodyEl);
    card.add(linkEl);
    card.add(clickOverlay);

    return card;
  }

  public reposition(w: number, h: number): void {
    this.width = w;
    this.height = h;

    const startY = Math.max(100, h * 0.15);

    this.titleText.setPosition(50, startY);
    this.subtitleText.setPosition(50, startY + 130);

    this.primaryBtn.setPosition(50, startY + 230);
    this.secondaryBtn.setPosition(230, startY + 230);

    this.cardsFlow.setPosition(50, startY + 310);
    this.cardsFlow.maxWidth = Math.max(400, w - 100);
    this.cardsFlow.layout();
  }

  public update(dt: number, time: number): void {
    super.update(dt, time);

    // Update background particles
    for (const p of this.particles) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      // Wrap around bounds
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    }
  }

  public render(r: IRenderer): void {
    // 1. Radial background gradient glow
    r.beginPath();
    r.moveTo(0, 0);
    r.lineTo(this.width, 0);
    r.lineTo(this.width, this.height);
    r.lineTo(0, this.height);
    r.closePath();
    r.fill("#0b0f19");

    // Subtle background mesh lines
    r.beginPath();
    const gridSpacing = 40;
    for (let x = 0; x < this.width; x += gridSpacing) {
      r.moveTo(x, 0);
      r.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += gridSpacing) {
      r.moveTo(0, y);
      r.lineTo(this.width, y);
    }
    r.stroke("rgba(99, 102, 241, 0.03)", 1);

    // Dynamic background glow
    const grad = "rgba(139, 92, 246, 0.05)";
    r.save();
    r.beginPath();
    r.arc(this.width * 0.7, this.height * 0.3, 200, 0, Math.PI * 2);
    r.closePath();
    r.fill(grad);
    r.restore();

    // 2. Draw background particles
    for (const p of this.particles) {
      r.beginPath();
      r.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      r.closePath();
      r.fill("rgba(167, 139, 250, 0.2)");
    }
  }
}
