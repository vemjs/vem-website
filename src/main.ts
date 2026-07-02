import "./style.css";
import { Scene } from "@vectojs/core";
import { WorkspaceExplorer } from "@vemjs/renderer-vecto";
import { ConfigLoader } from "@vemjs/core";
import { PluginRegistry } from "@vemjs/plugin-api";

console.log(
  "%cVem — Next-Gen Modal Text Editor",
  "color: #8b5cf6; font-size: 20px; font-weight: bold; text-shadow: 0 2px 10px rgba(139, 92, 246, 0.4);",
);
console.log(
  "%cPowered by VectoUI (WebGL Canvas Engine)",
  "color: #6366f1; font-size: 14px;",
);

// Initialize the Vem Editor on the playground canvas
const canvas = document.getElementById("vem-canvas") as HTMLCanvasElement;
if (canvas) {
  const scene = new Scene(canvas);

  const welcomeText = `Welcome to Vem!

This is a live editor playground powered entirely by the VectoUI zero-DOM canvas rendering engine.

Basic modal editing features:
  - Press 'i' to enter INSERT mode. Type text.
  - Press 'Escape' to return to NORMAL mode.
  - Press 'v' to enter VISUAL mode. Select characters using 'h'/'l'.
  - Press ':' to bring up the COMMAND bar. Type 'w' and press 'Enter' to save.

Use splits and tabs:
  - Command ':vsp' creates a vertical pane split.
  - Command ':sp' creates a horizontal pane split.
  - Command ':q' closes the active pane.

To start, click here to focus, then enjoy modal editing!`;

  const explorer = new WorkspaceExplorer(
    canvas.width,
    canvas.height,
    welcomeText,
  );

  explorer.onDidOpenDirectory(async (nodes, fsHandler) => {
    const configNode = nodes.find(
      (node) => node.label === ".vemrc.json" || node.label === ".vemrc.js",
    );
    if (configNode) {
      const fileHandle = fsHandler.getFileHandle(configNode.id);
      if (fileHandle) {
        try {
          const configContent = await fsHandler.readFile(fileHandle);
          console.log(`Found config file: ${configNode.label}, loading...`);
          const activeState = explorer
            .getWorkspace()
            .getActiveLayout()
            ?.getActiveState();
          if (activeState) {
            const registry = new PluginRegistry(activeState);
            const loader = new ConfigLoader(activeState);
            if (configNode.label.endsWith(".json")) {
              const config = JSON.parse(configContent);
              await loader.loadConfigFromObject(config, registry);
            } else {
              // .vemrc.js
              await loader.loadConfigFromJsString(configContent, registry);
            }
            console.log(`Configuration successfully applied.`);
          }
        } catch (err) {
          console.error(`Failed to load workspace config:`, err);
        }
      }
    }
  });

  scene.add(explorer);
  scene.start();

  canvas.tabIndex = 0; // make canvas focusable
  canvas.addEventListener("keydown", (e) => {
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

    const activeLayout = explorer.getWorkspace().getActiveLayout();
    const activeState = activeLayout?.getActiveState();
    if (activeState) {
      let mappedKey = e.key;
      if (e.ctrlKey) {
        if (e.key === "r") mappedKey = "<C-r>";
        else if (e.key === "v") mappedKey = "<C-v>";
      }
      activeState.handleKey(mappedKey);
    }
  });

  // Automatically focus canvas on click
  canvas.addEventListener("click", () => {
    canvas.focus();
  });
}

// Simple microinteraction: Ripple effect on glass cards
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e: Event) => {
    const mouseEvent = e as MouseEvent;
    const rect = (card as HTMLElement).getBoundingClientRect();
    const x = mouseEvent.clientX - rect.left;
    const y = mouseEvent.clientY - rect.top;

    (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
    (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
  });
});
