import "./style.css";
import { Scene } from "@vectojs/core";
import { UIComponent, Button } from "@vectojs/ui";
import type { IRenderer } from "@vectojs/core";
import { WorkspaceExplorer } from "@vemjs/renderer-vecto";
import type { PluginRegistry } from "@vemjs/plugin-api";
import { ConfigLoader, type VemEditorState } from "@vemjs/core";
import { PluginPanel } from "./plugins/PluginPanel";
import { createOfficialPluginRegistry } from "./plugins/officialPlugins";

// View Imports
import { HomeView } from "./views/HomeView";
import { DocsView } from "./views/DocsView";
import { ConfigView } from "./views/ConfigView";

const NAV_HEIGHT = 64;
const DESKTOP_PLUGIN_PANEL_WIDTH = 360;
const MIN_PLUGIN_PANEL_WIDTH = 320;
const PLAYGROUND_PLUGIN_BREAKPOINT = 1160;

class Navbar extends UIComponent {
  private homeBtn: Button;
  private playgroundBtn: Button;
  private docsBtn: Button;
  private configBtn: Button;
  private currentActiveRoute = "home";

  constructor(width: number, onNavigate: (route: string) => void) {
    super();
    this.width = width;
    this.height = NAV_HEIGHT;

    const createNavBtn = (label: string, route: string) => {
      const btn = new Button(label, {
        onClick: () => onNavigate(route),
        bg: "transparent",
        hoverBg: "rgba(45, 212, 191, 0.1)",
        color: "#9fb7af",
        font: "600 14px Outfit, sans-serif",
        radius: 999,
      });
      btn.width = 120;
      btn.height = 38;
      this.add(btn);
      return btn;
    };

    this.homeBtn = createNavBtn("Home", "home");
    this.playgroundBtn = createNavBtn("Playground", "playground");
    this.docsBtn = createNavBtn("Docs", "docs");
    this.configBtn = createNavBtn("Config", "config");

    this.setRouteActive("home");
    this.layoutButtons(width);
  }

  public resize(width: number): void {
    this.width = width;
    this.layoutButtons(width);
  }

  private layoutButtons(width: number): void {
    const compact = width < 760;
    const startX = compact ? 112 : 300;
    const gap = compact ? 82 : 130;
    const buttonWidth = compact ? 74 : 120;
    const labels = compact
      ? ["Home", "Play", "Docs", "Config"]
      : ["Home", "Playground", "Docs", "Config"];
    const buttons = [
      this.homeBtn,
      this.playgroundBtn,
      this.docsBtn,
      this.configBtn,
    ];

    for (let i = 0; i < buttons.length; i++) {
      buttons[i].label = labels[i];
      buttons[i].textWidth = labels[i].length * (compact ? 7 : 8);
      buttons[i].width = buttonWidth;
      buttons[i].setPosition(startX + i * gap, 13);
    }
  }

  public setRouteActive(route: string): void {
    this.currentActiveRoute = route;
    const btns = [
      this.homeBtn,
      this.playgroundBtn,
      this.docsBtn,
      this.configBtn,
    ];
    const routes = ["home", "playground", "docs", "config"];
    for (let i = 0; i < btns.length; i++) {
      const btn = btns[i];
      const isActive = routes[i] === route;
      btn.color = isActive ? "#2dd4bf" : "#9fb7af";
      btn.bg = isActive ? "rgba(45, 212, 191, 0.12)" : "transparent";
    }
  }

  public render(r: IRenderer): void {
    r.beginPath();
    r.moveTo(0, 0);
    r.lineTo(this.width, 0);
    r.lineTo(this.width, NAV_HEIGHT);
    r.lineTo(0, NAV_HEIGHT);
    r.closePath();
    r.fill("rgba(5, 13, 12, 0.96)");

    r.beginPath();
    r.moveTo(0, NAV_HEIGHT);
    r.lineTo(this.width, NAV_HEIGHT);
    r.closePath();
    r.stroke("rgba(45, 212, 191, 0.2)", 1.2);

    r.beginPath();
    r.roundRect(24, 16, 34, 32, 9);
    r.closePath();
    r.fill("#14342f");
    r.stroke("rgba(45, 212, 191, 0.5)", 1);

    r.fillText("V", 35, 39, "800 20px Outfit, sans-serif", "#2dd4bf");
    r.fillText("Vem", 70, 39, "800 22px Outfit, sans-serif", "#edf7f3");
    if (this.width >= 760) {
      r.fillText(
        "canvas-native editor",
        118,
        39,
        "600 10px JetBrains Mono, monospace",
        "#f4b860",
      );
    }

    const routes = ["home", "playground", "docs", "config"];
    const activeIdx = routes.indexOf(this.currentActiveRoute);
    if (activeIdx !== -1) {
      const compact = this.width < 760;
      const indicatorX =
        (compact ? 112 : 300) + activeIdx * (compact ? 82 : 130) + 14;
      r.beginPath();
      r.moveTo(indicatorX, 54);
      r.lineTo(indicatorX + (compact ? 46 : 84), 54);
      r.closePath();
      r.stroke("#2dd4bf", 2);
    }
  }
}

// 1. Setup Fullscreen Canvas & Scene
const canvas = document.getElementById("vem-canvas") as HTMLCanvasElement;
if (canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const scene = new Scene(canvas);

  // Welcome Text for the Playground editor
  const welcomeText = `Welcome to Vem Playground!

This is a live editor playground.
It runs inside the VectoJS canvas renderer.

Modal editing guides:
  - Press 'i' to enter INSERT mode. Type text.
  - Press 'Escape' to return to NORMAL mode.
  - Press 'v' to enter VISUAL mode. Select characters with 'h'/'l'.
  - Press ':' to enter COMMAND mode. Try splitting the panels:
      - Type ':vsp' for a vertical split.
      - Type ':sp' for a horizontal split.
      - Type ':q' to close the active pane.

Official plugins are loaded on startup:
  - Telescope opens a command/file picker.
  - Lualine updates the statusline.
  - Git, Treesitter, Autopairs, and Trim all run live.

Click Plugin Lab actions on the right to smoke-test them.
Use 'Open Folder' to load a workspace .vemrc.json/.vemrc.js.`;

  // 2. Instantiate Views
  let activeRoute = "playground";
  const homeView = new HomeView(
    canvas.width,
    canvas.height,
    () => navigate("playground"),
    () => navigate("docs"),
    () => navigate("config"),
  );

  const playgroundView = new WorkspaceExplorer(
    canvas.width,
    canvas.height - NAV_HEIGHT,
    welcomeText,
  );
  playgroundView.setPosition(0, NAV_HEIGHT);

  const playgroundRegistries = new WeakMap<VemEditorState, PluginRegistry>();
  const seedProjectFiles = (state: VemEditorState) => {
    if (state.projectFiles.length > 0) return;
    state.projectFiles = [
      "src/main.ts",
      "src/views/HomeView.ts",
      "src/views/DocsView.ts",
      "src/views/ConfigView.ts",
      "package.json",
      "README.md",
    ];
  };
  const getActivePlaygroundState = () =>
    playgroundView.getActiveEditorState() as VemEditorState | null;
  const getPlaygroundRegistry = () => {
    const activeState = getActivePlaygroundState();
    if (!activeState) return null;
    seedProjectFiles(activeState);

    let registry = playgroundRegistries.get(activeState);
    if (!registry) {
      registry = createOfficialPluginRegistry(activeState);
      playgroundRegistries.set(activeState, registry);
    }
    return registry;
  };
  getPlaygroundRegistry();

  const pluginPanel = new PluginPanel(
    DESKTOP_PLUGIN_PANEL_WIDTH,
    canvas.height - NAV_HEIGHT,
    getActivePlaygroundState,
    getPlaygroundRegistry,
  );

  // Hook workspace loader config logic
  playgroundView.onDidOpenDirectory(async (nodes, fsHandler) => {
    const configNode = nodes.find(
      (node) => node.label === ".vemrc.json" || node.label === ".vemrc.js",
    );
    if (configNode) {
      const fileHandle = fsHandler.getFileHandle(configNode.id);
      if (fileHandle) {
        try {
          const configContent = await fsHandler.readFile(fileHandle);
          console.log(`Found config file: ${configNode.label}, loading...`);
          const activeState = playgroundView
            .getWorkspace()
            .getActiveLayout()
            ?.getActiveState();
          if (activeState) {
            const registry = getPlaygroundRegistry();
            if (!registry) return;
            const loader = new ConfigLoader(activeState);
            if (configNode.label.endsWith(".json")) {
              const config = JSON.parse(configContent);
              await loader.loadConfigFromObject(config, registry);
            } else {
              await loader.loadConfigFromJsString(configContent, registry);
            }
            console.log("Configuration successfully loaded into workspace.");
          }
        } catch (err) {
          console.error("Failed to load workspace config:", err);
        }
      }
    }
  });

  const docsView = new DocsView(canvas.width, canvas.height);
  const configView = new ConfigView(canvas.width, canvas.height);

  // 3. Navigation Bar (hidden by default)
  const navbar = new Navbar(canvas.width, (route) => navigate(route));
  navbar.id = "navbar";

  const layoutPlayground = (w: number, h: number) => {
    const contentHeight = h - NAV_HEIGHT;
    const panelWidth =
      w >= PLAYGROUND_PLUGIN_BREAKPOINT
        ? Math.max(
            MIN_PLUGIN_PANEL_WIDTH,
            Math.min(DESKTOP_PLUGIN_PANEL_WIDTH, w * 0.24),
          )
        : 0;

    playgroundView.setPosition(0, NAV_HEIGHT);
    playgroundView.width = w - panelWidth;
    playgroundView.height = contentHeight;

    pluginPanel.setPosition(w - panelWidth, NAV_HEIGHT);
    pluginPanel.resize(panelWidth, contentHeight);
  };

  const mountRoute = (route: string) => {
    if (route === "home") scene.add(homeView);
    else if (route === "playground") {
      layoutPlayground(canvas.width, canvas.height);
      getPlaygroundRegistry();
      scene.add(playgroundView);
      if (canvas.width >= PLAYGROUND_PLUGIN_BREAKPOINT) scene.add(pluginPanel);
    } else if (route === "docs") scene.add(docsView);
    else if (route === "config") scene.add(configView);

    scene.remove(navbar);
    scene.add(navbar);
  };

  const unmountRoute = (route: string) => {
    if (route === "home") scene.remove(homeView);
    else if (route === "playground") {
      scene.remove(playgroundView);
      scene.remove(pluginPanel);
    } else if (route === "docs") scene.remove(docsView);
    else if (route === "config") scene.remove(configView);
  };

  // 4. Routing function
  const navigate = (route: string) => {
    if (route === activeRoute) return;

    unmountRoute(activeRoute);

    activeRoute = route;
    navbar.setRouteActive(route);
    mountRoute(route);

    // Sync hash in URL
    if (window.location.hash !== `#${route}`) {
      window.location.hash = route;
    }

    // Auto-focus canvas on view transition
    canvas.focus();
  };

  // Sync route on hash change
  const syncRouteFromHash = () => {
    const hash = window.location.hash.substring(1);
    const validRoutes = ["home", "playground", "docs", "config"];
    if (validRoutes.includes(hash)) {
      navigate(hash);
    } else {
      navigate("home");
    }
  };

  window.addEventListener("hashchange", syncRouteFromHash);

  // Default initial mount based on current URL hash
  const initialHash = window.location.hash.substring(1);
  const validRoutes = ["home", "playground", "docs", "config"];
  activeRoute = validRoutes.includes(initialHash) ? initialHash : "home";

  navbar.setRouteActive(activeRoute);
  mountRoute(activeRoute);
  scene.start();

  // 5. Canvas Event routing
  canvas.tabIndex = 0;
  canvas.focus();

  canvas.addEventListener("click", () => {
    canvas.focus();
  });

  canvas.addEventListener("keydown", (e) => {
    // Only route editor keys if we are in the playground view
    if (activeRoute !== "playground") return;

    // Prevent default browser behavior for standard Vim binds to avoid page scrolling
    if (
      [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Backspace",
      ].includes(e.key) ||
      (e.key === "r" && e.ctrlKey) ||
      (e.key === "v" && e.ctrlKey)
    ) {
      e.preventDefault();
    }

    const activeLayout = playgroundView.getWorkspace().getActiveLayout();
    const activeState = activeLayout?.getActiveState();
    if (activeState) {
      let mappedKey = e.key;
      if (e.ctrlKey) {
        if (e.key === "r") mappedKey = "<C-r>";
        else if (e.key === "v") mappedKey = "<C-v>";
      }
      activeState.handleKey(mappedKey);
      activeLayout?.refreshActivePane();
    }
  });

  // 6. Handle Viewport Resizing dynamically
  const handleResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    navbar.resize(w);
    homeView.reposition(w, h);
    layoutPlayground(w, h);
    docsView.reposition(w, h);
    configView.reposition(w, h);

    scene.resize(w, h);
    scene.markDirty();
  };
  window.addEventListener("resize", handleResize);

  // Set initial sizes
  handleResize();

  // 7. Devtools hook: ?debug attaches the VMT inspector and exposes a
  // headless handle for agents/tests (forge convention).
  if (new URLSearchParams(window.location.search).has("debug")) {
    import("@vectojs/devtools").then(
      ({ attachDevtools, auditScene, captureSnapshot }) => {
        attachDevtools(scene);
        // Documented audit exemptions (intentional stacking):
        // - the fixed navbar overlays every routed view by design
        // - card-overlay-* Buttons are invisible full-card click targets
        const intentional = (e: { id: string }) =>
          e.id === "navbar" || e.id.startsWith("card-overlay-");
        (window as unknown as Record<string, unknown>).__vem = {
          scene,
          audit: () =>
            auditScene(scene, {
              ignoreOverlap: (a, b) => intentional(a) || intentional(b),
            }),
          snapshot: () => captureSnapshot(scene),
          getActiveEditorState: getActivePlaygroundState,
          navigate,
        };
      },
    );
  }
}
