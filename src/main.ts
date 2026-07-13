import "./style.css";
import { Scene } from "@vectojs/core";
import {
  WorkspaceExplorer,
  CTRL_VIM_KEYS,
  PREVENT_CTRL_KEYS,
} from "@vemjs/renderer-vecto";
import type { PluginRegistry } from "@vemjs/plugin-api";
import { ConfigLoader, VemEditorState } from "@vemjs/core";
import { PluginPanel } from "./plugins/PluginPanel";
import {
  createOfficialPluginRegistry,
  activatePluginById,
} from "./plugins/officialPlugins";
import { HELP_TEXT, VEMRC_TEMPLATE } from "./help";

// vem.run IS the editor — no landing page, no routes. Docs and config live
// behind :help / :docs / :config, the way Vim would do it.
const DESKTOP_PLUGIN_PANEL_WIDTH = 360;
const MIN_PLUGIN_PANEL_WIDTH = 320;
const PLUGIN_PANEL_BREAKPOINT = 1160;

const canvas = document.getElementById("vem-canvas") as HTMLCanvasElement;
if (canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const scene = new Scene(canvas);

  // Boot like a fresh Vim: an empty buffer (the renderer draws the ~ column and
  // the centered intro splash). Everything else is opt-in via commands.
  // Logical (CSS) size — canvas.width is the DPR-scaled backing store and
  // seeds the workspace at dpr× the real viewport.
  const playgroundView = new WorkspaceExplorer(
    window.innerWidth,
    window.innerHeight,
    "",
  );

  const playgroundRegistries = new WeakMap<VemEditorState, PluginRegistry>();
  const seedProjectFiles = (state: VemEditorState) => {
    if (state.projectFiles.length > 0) return;
    state.projectFiles = [
      "src/main.ts",
      "src/help.ts",
      "src/plugins/PluginPanel.ts",
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

  // --- Ex commands (global, Vim semantics: every pane/tab state sees them)
  const openSplitWithText = (text: string) => {
    const layout = playgroundView.getWorkspace().getActiveLayout();
    if (!layout) return;
    layout.splitActivePane("horizontal", text);
    scene.markDirty();
  };
  VemEditorState.registerGlobalExCommand("help", () =>
    openSplitWithText(HELP_TEXT),
  );
  VemEditorState.registerGlobalExCommand("h", () =>
    openSplitWithText(HELP_TEXT),
  );
  VemEditorState.registerGlobalExCommand("docs", () =>
    openSplitWithText(HELP_TEXT),
  );
  VemEditorState.registerGlobalExCommand("config", () =>
    openSplitWithText(VEMRC_TEMPLATE),
  );

  // Panel visibility (issue: both side panels must be closable). The file tree
  // is owned by WorkspaceExplorer; the Plugin Lab is website chrome.
  // Both side panels start closed — bare Vim. Open them with :Explorer and
  // :PluginLab (or :plugins).
  let pluginPanelUserHidden = true;
  const toggleFileTree = () => {
    playgroundView.toggleSidebar();
    scene.markDirty();
  };
  const togglePluginLab = () => {
    pluginPanelUserHidden = !pluginPanelUserHidden;
    // Logical (CSS) size — canvas.width is the DPR-scaled backing store.
    layoutEditor(window.innerWidth, window.innerHeight);
    scene.markDirty();
  };
  VemEditorState.registerGlobalExCommand("Explorer", toggleFileTree);
  VemEditorState.registerGlobalExCommand("tree", toggleFileTree);
  VemEditorState.registerGlobalExCommand("NERDTree", toggleFileTree);
  VemEditorState.registerGlobalExCommand("PluginLab", togglePluginLab);
  VemEditorState.registerGlobalExCommand("plugins", togglePluginLab);

  // Appearance-changing plugins are opt-in (like Vim's :syntax on).
  const activate = (id: string) => () => {
    const registry = getPlaygroundRegistry();
    if (registry) activatePluginById(registry, id);
    scene.markDirty();
  };
  VemEditorState.registerGlobalExCommand("Lualine", activate("lualine"));
  VemEditorState.registerGlobalExCommand("Treesitter", activate("treesitter"));
  VemEditorState.registerGlobalExCommand("syntax", activate("treesitter"));

  const pluginPanel = new PluginPanel(
    DESKTOP_PLUGIN_PANEL_WIDTH,
    window.innerHeight,
    getActivePlaygroundState,
    getPlaygroundRegistry,
  );

  // Hook workspace loader config logic
  playgroundView.onDidOpenDirectory(async (nodes, dir) => {
    const configNode = nodes.find(
      (node) => node.label === ".vemrc.json" || node.label === ".vemrc.js",
    );
    if (!configNode) return;
    try {
      const configContent = await dir.readFile(configNode.id);
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
  });

  const layoutEditor = (w: number, h: number) => {
    const panelWidth =
      w >= PLUGIN_PANEL_BREAKPOINT && !pluginPanelUserHidden
        ? Math.max(
            MIN_PLUGIN_PANEL_WIDTH,
            Math.min(DESKTOP_PLUGIN_PANEL_WIDTH, w * 0.24),
          )
        : 0;

    playgroundView.setPosition(0, 0);
    playgroundView.width = w - panelWidth;
    playgroundView.height = h;

    pluginPanel.setPosition(w - panelWidth, 0);
    pluginPanel.resize(panelWidth, h);

    if (panelWidth > 0 && !pluginPanel.parent) {
      scene.add(pluginPanel);
    } else if (panelWidth === 0 && pluginPanel.parent) {
      scene.remove(pluginPanel);
    }
  };

  // File tree closed on boot — opened with :Explorer.
  playgroundView.setSidebarVisible(false);

  // --- Persist open buffers across reloads. The web build has no backing
  // filesystem to reopen from, so a bare refresh previously wiped every
  // unsaved edit — restoring happens before the first scene.start() render
  // so there's no empty-then-restored flash.
  const PERSIST_KEY = "vem.buffers.v1";
  const restoreSnapshot = ():
    { label: string; text: string; active: boolean }[] | null => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };
  const saveSnapshot = () => {
    try {
      localStorage.setItem(
        PERSIST_KEY,
        JSON.stringify(playgroundView.getWorkspace().getBuffersSnapshot()),
      );
    } catch {
      // Storage full or unavailable (private browsing) — losing autosave is
      // better than crashing the editor over it.
    }
  };

  const savedSnapshot = restoreSnapshot();
  if (savedSnapshot) {
    playgroundView.getWorkspace().restoreBuffersSnapshot(savedSnapshot);
  }
  setInterval(saveSnapshot, 2000);
  window.addEventListener("beforeunload", saveSnapshot);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveSnapshot();
  });

  scene.add(playgroundView);
  layoutEditor(window.innerWidth, window.innerHeight);
  scene.start();

  // --- Keyboard routing: canvas keeps focus; the projected a11y textarea
  // takes over via the entity path once the user clicks into the editor.
  canvas.tabIndex = 0;
  canvas.focus();

  canvas.addEventListener("click", () => {
    canvas.focus();
  });

  // Clicking non-focusable chrome (tab strip, panels — now covered by the
  // engine's pointer-events:auto projection overlay) drops focus to <body>,
  // where neither the canvas listener nor the entity path hears keys. The
  // router therefore lives on window; engine-owned focus targets (the a11y
  // textarea, devtools inputs) keep exclusive ownership of their keys.
  const engineOwnsKeys = (e: KeyboardEvent): boolean => {
    const t = e.target;
    return t instanceof HTMLElement && t !== canvas && t !== document.body;
  };

  // Ctrl-combinations Vim owns → the key we feed the state machine. Sourced
  // from @vemjs/renderer-vecto so this table can never drift from the one a
  // VemEditorEntity uses on its own a11y textarea's native keydown — a
  // second, smaller local copy here is exactly how Ctrl-D/U/F/B/E/Y ended up
  // hijacked by the browser whenever a pane (not the window) had DOM focus.
  // Keys we always keep the browser from hijacking while the editor has focus.
  const PREVENT_PLAIN = new Set([
    "Space",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Tab",
    "Backspace",
    "/", // Vim search; also Chrome quick-find in some setups
  ]);

  window.addEventListener("keydown", (e) => {
    if (engineOwnsKeys(e)) return;
    // IME composition produces 'Process'/composing keydowns — feeding them
    // to the state machine corrupts the buffer. The composed text arrives
    // through the projected textarea instead.
    if (e.isComposing || e.key === "Process") return;

    const ctrl = e.ctrlKey || e.metaKey;
    let mappedKey = e.key;

    if (ctrl && !e.altKey) {
      const vimKey = CTRL_VIM_KEYS[e.key.toLowerCase()];
      if (vimKey) {
        mappedKey = vimKey;
        e.preventDefault();
      } else if (PREVENT_CTRL_KEYS.has(e.key.toLowerCase())) {
        // Editor-relevant browser shortcuts we suppress but don't yet map
        // (save/print/find-next…). Ctrl-W/T/N stay native — browsers ignore
        // preventDefault on those, and blocking tab/window control is hostile.
        e.preventDefault();
        return;
      } else {
        // Let genuine browser combos (copy/paste/Ctrl-A, devtools) pass through.
        return;
      }
    } else if (PREVENT_PLAIN.has(e.key)) {
      e.preventDefault();
    }

    const activeLayout = playgroundView.getWorkspace().getActiveLayout();
    const activeState = activeLayout?.getActiveState();
    if (activeState) {
      activeState.handleKey(mappedKey);
      activeLayout?.refreshActivePane();
    }
  });

  const handleResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    layoutEditor(w, h);
    scene.resize(w, h);
    scene.markDirty();
  };
  window.addEventListener("resize", handleResize);
  handleResize();

  // Devtools hook: ?debug attaches the VMT inspector and exposes a headless
  // handle for agents/tests (forge convention).
  if (new URLSearchParams(window.location.search).has("debug")) {
    import("@vectojs/devtools").then(
      ({ attachDevtools, auditScene, captureSnapshot }) => {
        attachDevtools(scene);
        (window as unknown as Record<string, unknown>).__vem = {
          scene,
          audit: () => auditScene(scene),
          snapshot: () => captureSnapshot(scene),
          getActiveEditorState: getActivePlaygroundState,
          getWorkspace: () => playgroundView.getWorkspace(),
          getRegistry: getPlaygroundRegistry,
        };
      },
    );
  }
}
