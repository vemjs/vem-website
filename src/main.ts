import './style.css';
import { Scene } from '@vectojs/core';
import { UIComponent, Button } from '@vectojs/ui';
import type { IRenderer } from '@vectojs/core';
import { WorkspaceExplorer } from '@vemjs/renderer-vecto';
import { PluginRegistry } from '@vemjs/plugin-api';
import { ConfigLoader } from '@vemjs/core';

// View Imports
import { HomeView } from './views/HomeView';
import { DocsView } from './views/DocsView';
import { ConfigView } from './views/ConfigView';

class Navbar extends UIComponent {
  private homeBtn: Button;
  private playgroundBtn: Button;
  private docsBtn: Button;
  private configBtn: Button;
  private currentActiveRoute = 'home';

  constructor(width: number, onNavigate: (route: string) => void) {
    super();
    this.width = width;
    this.height = 50;

    const createNavBtn = (label: string, x: number, route: string) => {
      const btn = new Button(label, {
        onClick: () => onNavigate(route),
        bg: 'transparent',
        hoverBg: 'rgba(255, 255, 255, 0.05)',
        color: '#94a3b8',
        font: '600 14px Outfit, sans-serif',
        radius: 4,
      });
      btn.width = 120;
      btn.height = 36;
      btn.setPosition(x, 7);
      this.add(btn);
      return btn;
    };

    this.homeBtn = createNavBtn('Home', 150, 'home');
    this.playgroundBtn = createNavBtn('Playground', 280, 'playground');
    this.docsBtn = createNavBtn('Docs', 410, 'docs');
    this.configBtn = createNavBtn('Config Builder', 540, 'config');

    this.setRouteActive('home');
  }

  public setRouteActive(route: string): void {
    this.currentActiveRoute = route;
    const btns = [this.homeBtn, this.playgroundBtn, this.docsBtn, this.configBtn];
    const routes = ['home', 'playground', 'docs', 'config'];
    for (let i = 0; i < btns.length; i++) {
      const btn = btns[i];
      const isActive = routes[i] === route;
      btn.color = isActive ? '#a78bfa' : '#94a3b8'; // violet-400 for active
    }
  }

  public render(r: IRenderer): void {
    // Fill navbar background
    r.beginPath();
    r.moveTo(0, 0);
    r.lineTo(this.width, 0);
    r.lineTo(this.width, 50);
    r.lineTo(0, 50);
    r.closePath();
    r.fill('#090d16');
    r.stroke('#1f2937', 1.2);

    // Draw Vem logo text
    r.fillText('Vem', 20, 32, 'bold 22px Outfit, sans-serif', '#ffffff');
    r.fillText('dev', 70, 30, '600 10px monospace', '#818cf8');

    // Draw bottom active indicator bar
    const routes = ['home', 'playground', 'docs', 'config'];
    const activeIdx = routes.indexOf(this.currentActiveRoute);
    if (activeIdx !== -1) {
      const indicatorX = 150 + activeIdx * 130 + 10;
      r.beginPath();
      r.moveTo(indicatorX, 48);
      r.lineTo(indicatorX + 100, 48);
      r.closePath();
      r.stroke('#8b5cf6', 2); // violet-500 underline
    }
  }
}

// 1. Setup Fullscreen Canvas & Scene
const canvas = document.getElementById('vem-canvas') as HTMLCanvasElement;
if (canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const scene = new Scene(canvas);

  // Welcome Text for the Playground editor
  const welcomeText = `Welcome to Vem Playground!

This is a live editor playground running 100% inside VectoJS canvas renderer.

Modal editing guides:
  - Press 'i' to enter INSERT mode. Type text.
  - Press 'Escape' to return to NORMAL mode.
  - Press 'v' to enter VISUAL mode. Select characters with 'h'/'l'.
  - Press ':' to enter COMMAND mode. Try splitting the panels:
      - Type ':vsp' for a vertical split.
      - Type ':sp' for a horizontal split.
      - Type ':q' to close the active pane.

To try loading local workspace config, click 'Open Folder' in the sidebar and select a project with a '.vemrc.json' or '.vemrc.js' file in its root!`;

  // 2. Instantiate Views
  let activeRoute = 'home';

  const homeView = new HomeView(
    canvas.width,
    canvas.height,
    () => navigate('playground'),
    () => navigate('docs'),
    () => navigate('config')
  );

  const playgroundView = new WorkspaceExplorer(
    canvas.width,
    canvas.height - 50,
    welcomeText
  );
  // Position playground view right below the navbar
  playgroundView.setPosition(0, 50);

  // Hook workspace loader config logic
  playgroundView.onDidOpenDirectory(async (nodes, fsHandler) => {
    const configNode = nodes.find(
      (node) => node.label === '.vemrc.json' || node.label === '.vemrc.js'
    );
    if (configNode) {
      const fileHandle = fsHandler.getFileHandle(configNode.id);
      if (fileHandle) {
        try {
          const configContent = await fsHandler.readFile(fileHandle);
          console.log(`Found config file: ${configNode.label}, loading...`);
          const activeState = playgroundView.getWorkspace().getActiveLayout()?.getActiveState();
          if (activeState) {
            const registry = new PluginRegistry(activeState);
            const loader = new ConfigLoader(activeState);
            if (configNode.label.endsWith('.json')) {
              const config = JSON.parse(configContent);
              await loader.loadConfigFromObject(config, registry);
            } else {
              await loader.loadConfigFromJsString(configContent, registry);
            }
            console.log('Configuration successfully loaded into workspace.');
          }
        } catch (err) {
          console.error('Failed to load workspace config:', err);
        }
      }
    }
  });

  const docsView = new DocsView(canvas.width, canvas.height);
  const configView = new ConfigView(canvas.width, canvas.height);

  // 3. Navigation Bar
  const navbar = new Navbar(canvas.width, (route) => navigate(route));

  // Default initial mount
  scene.add(homeView);
  scene.add(navbar);
  scene.start();

  // 4. Routing function
  const navigate = (route: string) => {
    if (route === activeRoute) return;

    // Remove active view
    if (activeRoute === 'home') scene.remove(homeView);
    else if (activeRoute === 'playground') scene.remove(playgroundView);
    else if (activeRoute === 'docs') scene.remove(docsView);
    else if (activeRoute === 'config') scene.remove(configView);

    // Add new view
    if (route === 'home') scene.add(homeView);
    else if (route === 'playground') scene.add(playgroundView);
    else if (route === 'docs') scene.add(docsView);
    else if (route === 'config') scene.add(configView);

    activeRoute = route;
    navbar.setRouteActive(route);
    
    // Auto-focus canvas on view transition
    canvas.focus();
  };

  // 5. Canvas Event routing
  canvas.tabIndex = 0;
  canvas.focus();

  canvas.addEventListener('click', () => {
    canvas.focus();
  });

  canvas.addEventListener('keydown', (e) => {
    // Only route editor keys if we are in the playground view
    if (activeRoute !== 'playground') return;

    // Prevent default browser behavior for standard Vim binds to avoid page scrolling
    if (
      [
        'Space',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        'Backspace',
      ].includes(e.key) ||
      (e.key === 'r' && e.ctrlKey) ||
      (e.key === 'v' && e.ctrlKey)
    ) {
      e.preventDefault();
    }

    const activeLayout = playgroundView.getWorkspace().getActiveLayout();
    const activeState = activeLayout?.getActiveState();
    if (activeState) {
      let mappedKey = e.key;
      if (e.ctrlKey) {
        if (e.key === 'r') mappedKey = '<C-r>';
        else if (e.key === 'v') mappedKey = '<C-v>';
      }
      activeState.handleKey(mappedKey);
    }
  });

  // 6. Handle Viewport Resizing dynamically
  const handleResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    navbar.width = w;
    homeView.reposition(w, h);
    playgroundView.width = w;
    playgroundView.height = h - 50;
    docsView.reposition(w, h);
    configView.reposition(w, h);

    scene.resize(w, h);
  };
  window.addEventListener('resize', handleResize);
  
  // Set initial sizes
  handleResize();
}
