import { UIComponent, Text, Button, Card, Flow, Link } from "@vectojs/ui";
import type { IRenderer } from "@vectojs/core";

export class HomeView extends UIComponent {
  private titleText: Text;
  private subtitleText: Text;
  private primaryBtn: Button;
  private secondaryBtn: Button;
  private cardsFlow: Flow;
  private featureCards: Card[] = [];
  private featureCardBodies: Text[] = [];
  private featureCardOverlays: Button[] = [];

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
    this.titleText = new Text("Vim Editing,\nNative Canvas UI.", {
      font: "800 56px Outfit, sans-serif",
      color: "#ffffff",
      maxWidth: 800,
      lineHeight: 62,
    });

    // 3. Subtitle Text
    this.subtitleText = new Text(
      "Vem keeps modal editing fast and familiar, then breaks out of the terminal grid with VectoJS: retained canvas scenes, semantic accessibility projection, rich panels, and plugin-driven editor UI.",
      {
        font: "16px Outfit, sans-serif",
        color: "#9fb7af",
        maxWidth: 700,
        lineHeight: 24,
      },
    );

    // 4. CTA Buttons
    this.primaryBtn = new Button("Launch Editor", {
      onClick: onLaunch,
      bg: "#0f766e",
      hoverBg: "#14b8a6",
      color: "#ecfeff",
      font: "600 16px Outfit, sans-serif",
      radius: 8,
    });
    this.primaryBtn.width = 160;
    this.primaryBtn.height = 45;

    this.secondaryBtn = new Button("GitHub Repository", {
      onClick: () =>
        window.open("https://github.com/vemjs/vem", "_blank", "noopener"),
      bg: "#17231f",
      hoverBg: "#203a34",
      color: "#edf7f3",
      font: "600 16px Outfit, sans-serif",
      radius: 8,
    });
    this.secondaryBtn.width = 180;
    this.secondaryBtn.height = 45;

    // 5. Feature cards flow layout
    this.cardsFlow = new Flow({ gap: 20, maxWidth: 850 });

    const cardDocs = this.createFeatureCard(
      "Documentation",
      "Vim motions, command references, renderer notes, and plugin API guides.",
      "Explore Docs",
      onViewDocs,
    );

    const cardFAQ = this.createFeatureCard(
      "Architectural FAQ",
      "How Vem combines a TypeScript Vim state machine with VectoJS Canvas runtime.",
      "Read FAQ",
      onViewDocs, // goes to FAQ section of docs
    );

    const cardConfig = this.createFeatureCard(
      "Visual Configurator",
      "Build a .vemrc.json from native canvas controls and export it instantly.",
      "Open Config Builder",
      onViewConfig,
    );

    const cardPlugins = this.createFeatureCard(
      "Plugin Lab",
      "Try official plugins directly in the Playground: Telescope, Lualine, Git signs, and more.",
      "Open Playground",
      onLaunch,
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
      height: 150,
      bg: "#0d1b18",
      border: "#1d3b35",
      radius: 16,
      padding: 20,
    });

    const titleEl = new Text(title, {
      font: "bold 18px Outfit, sans-serif",
      color: "#edf7f3",
    }).setPosition(20, 20);

    const bodyEl = new Text(body, {
      font: "14px Outfit, sans-serif",
      color: "#91aaa1",
      maxWidth: 360,
      lineHeight: 20,
    }).setPosition(20, 50);

    const linkEl = new Link(linkText, {
      href: "#",
      color: "#2dd4bf",
      font: "600 14px Outfit, sans-serif",
      underline: false,
    }).setPosition(20, 124);

    // Make the link clickable by hooking a button-like overlay if needed, or link component
    // Let's hook a button over the card area for direct interaction
    const clickOverlay = new Button("", {
      onClick,
      bg: "transparent",
      hoverBg: "rgba(45, 212, 191, 0.06)",
      radius: 12,
    });
    clickOverlay.width = 400;
    clickOverlay.height = 150;
    clickOverlay.setPosition(0, 0);
    // Stable id so audits can exempt this intentional full-card overlay.
    clickOverlay.id = `card-overlay-${this.featureCardOverlays.length}`;

    card.add(titleEl);
    card.add(bodyEl);
    card.add(linkEl);
    card.add(clickOverlay);

    this.featureCards.push(card);
    this.featureCardBodies.push(bodyEl);
    this.featureCardOverlays.push(clickOverlay);

    return card;
  }

  public reposition(w: number, h: number): void {
    this.width = w;
    this.height = h;

    const marginX = w < 560 ? 24 : 50;
    const contentWidth = Math.min(w - marginX * 2, w >= 1180 ? 760 : 860);
    const cardWidth = Math.min(400, Math.max(300, w - marginX * 2));
    const startY = Math.max(92, h * 0.12);

    this.titleText.setMaxWidth(contentWidth);
    this.subtitleText.setMaxWidth(Math.min(700, contentWidth));
    this.titleText.setPosition(marginX, startY);
    this.subtitleText.setPosition(marginX, startY + 130);

    this.primaryBtn.setPosition(marginX, startY + 224);
    this.secondaryBtn.setPosition(
      w < 560 ? marginX : marginX + 180,
      w < 560 ? startY + 280 : startY + 224,
    );

    for (let i = 0; i < this.featureCards.length; i++) {
      this.featureCards[i].width = cardWidth;
      this.featureCardBodies[i].setMaxWidth(cardWidth - 40);
      this.featureCardOverlays[i].width = cardWidth;
    }

    this.cardsFlow.setPosition(marginX, startY + (w < 560 ? 352 : 294));
    this.cardsFlow.maxWidth =
      w >= 1180 ? 860 : Math.max(cardWidth, w - marginX * 2);
    this.cardsFlow.layout();
  }

  public update(dt: number, time: number): void {
    super.update(dt, time);

    // VectoJS passes dt in milliseconds; keep the original per-frame velocity feel.
    const frameScale = dt / (1000 / 60);

    // Update background particles
    for (const p of this.particles) {
      p.x += p.vx * frameScale;
      p.y += p.vy * frameScale;

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
    r.fill("#06110f");

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
    r.stroke("rgba(45, 212, 191, 0.035)", 1);

    // Right-side vector cockpit silhouette.
    r.save();
    r.beginPath();
    r.arc(this.width * 0.72, this.height * 0.34, 210, 0, Math.PI * 2);
    r.closePath();
    r.fill("rgba(45, 212, 191, 0.055)");
    r.restore();

    if (this.width >= 1120) {
      r.beginPath();
      r.roundRect(this.width * 0.62, 130, 360, 220, 22);
      r.closePath();
      r.fill("rgba(13, 27, 24, 0.72)");
      r.stroke("rgba(45, 212, 191, 0.18)", 1.4);

      r.fillText(
        "NORMAL",
        this.width * 0.62 + 24,
        174,
        "700 12px JetBrains Mono, monospace",
        "#2dd4bf",
      );
      r.fillText(
        ":Telescope find_files",
        this.width * 0.62 + 24,
        214,
        "13px JetBrains Mono, monospace",
        "#edf7f3",
      );
      r.fillText(
        "git +  treesitter +  lualine",
        this.width * 0.62 + 24,
        254,
        "12px JetBrains Mono, monospace",
        "#f4b860",
      );
      r.fillText(
        "Scene -> Canvas pixels -> A11y shadow",
        this.width * 0.62 + 24,
        294,
        "11px JetBrains Mono, monospace",
        "#91aaa1",
      );
    }

    // 2. Draw background particles
    for (const p of this.particles) {
      r.beginPath();
      r.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      r.closePath();
      r.fill("rgba(45, 212, 191, 0.18)");
    }
  }
}
