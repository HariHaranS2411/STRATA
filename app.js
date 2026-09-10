// strata — Single-Pass Drone Video to 3D Model Dashboard
// Vanilla JS Application Controller

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentMissionId: 'aukerman',
    activePage: 'dashboard',
    theme: 'dark',
    isSidebarCollapsed: false,
    viewer3d: {
      rotX: 55,
      rotY: 0,
      rotZ: 25,
      zoom: 1.0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      viewMode: 'mesh', // 'mesh' | 'pointcloud' | 'wireframe'
      isMeasuring: false,
      measurePoints: [],
      measureDist: null
    },
    pipeline: {
      isRunning: false,
      currentStepIndex: 0,
      progress: 0,
      stepStatuses: [
        'passed', 'passed', 'passed', 'passed', 
        'blocked', 'blocked', 'blocked', 'blocked',
        'synth', 'synth', 'synth', 'blocked',
        'synth', 'synth', 'passed'
      ]
    },
    planner: {
      altitude: 60,
      speed: 8,
      overlap: 75,
      sidelap: 65,
      cameraPreset: 'mavic3'
    },
    detections: {
      filterMission: 'all',
      showBBoxes: true,
      showTags: true,
      showDynamicWarning: true
    },
    map: {
      simulatedAltitude: false
    }
  };

  // DOM Elements
  const els = {
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    navLinks: document.querySelectorAll('.nav-link'),
    pageViews: document.querySelectorAll('.page-view'),
    themeToggle: document.getElementById('themeToggle'),
    missionSelect: document.getElementById('missionSelect'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    modalClose: document.getElementById('modalClose')
  };

  // 1. Navigation & Router
  function navigateTo(pageId) {
    state.activePage = pageId;
    els.pageViews.forEach(page => {
      if (page.id === `page-${pageId}`) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    els.navLinks.forEach(link => {
      if (link.dataset.page === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Sub-view on-demand canvas draws
    if (pageId === '3d-viewer') {
      setTimeout(render3DCanvas, 50);
    } else if (pageId === 'map-gps') {
      setTimeout(renderMapCanvas, 50);
    } else if (pageId === 'mission-planner') {
      setTimeout(renderPlannerCanvas, 50);
    } else if (pageId === 'detections') {
      setTimeout(renderDetectionsGallery, 50);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  els.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page) navigateTo(page);
    });
  });

  // Handle in-page navigation links (e.g. data-nav attributes)
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-nav]');
    if (target) {
      e.preventDefault();
      navigateTo(target.getAttribute('data-nav'));
    }
  });

  // Sidebar Collapse
  if (els.sidebarToggle) {
    els.sidebarToggle.addEventListener('click', () => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
      els.sidebar.classList.toggle('collapsed', state.isSidebarCollapsed);
    });
  }

  // Theme Toggle
  if (els.themeToggle) {
    els.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', state.theme);
      els.themeToggle.innerHTML = state.theme === 'dark' 
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    });
  }

  // Mission Selector
  if (els.missionSelect) {
    els.missionSelect.addEventListener('change', (e) => {
      if (e.target.value === 'new') {
        navigateTo('upload');
        els.missionSelect.value = state.currentMissionId;
        return;
      }
      state.currentMissionId = e.target.value;
      updateMissionData();
    });
  }

  function updateMissionData() {
    const ds = STRATA_DATA.datasets[state.currentMissionId];
    if (!ds) return;

    // Update Dashboard stats
    const elTotImg = document.getElementById('statTotalImages');
    if (elTotImg) elTotImg.textContent = ds.totalImages.toLocaleString();

    const elLoc = document.getElementById('dashMissionLocation');
    if (elLoc) elLoc.textContent = ds.location;

    // Update upload view preview if present
    const elUpRes = document.getElementById('upPreviewRes');
    if (elUpRes) elUpRes.textContent = ds.resolution;
    const elUpSensor = document.getElementById('upPreviewSensor');
    if (elUpSensor) elUpSensor.textContent = ds.sensor;
    const elUpGps = document.getElementById('upPreviewGps');
    if (elUpGps) elUpGps.textContent = ds.gpsAvailable ? (ds.hasAltitude ? "Lat/Lon/Alt 3D" : "Lat/Lon 2D (No Altitude)") : "No GPS EXIF";

    // Refresh active views
    if (state.activePage === 'map-gps') renderMapCanvas();
    if (state.activePage === 'detections') renderDetectionsGallery();
  }

  // 2. Dashboard Rendering
  function initDashboard() {
    // Render Pipeline Data Flow Nodes
    const flowContainer = document.getElementById('pipelineFlowContainer');
    if (flowContainer) {
      flowContainer.innerHTML = STRATA_DATA.pipelineNodes.map((node, i) => {
        let badgeClass = 'badge-works';
        let statusIcon = '✅';
        let statusText = 'WORKS — REAL';

        if (node.type === 'blocked') {
          badgeClass = 'badge-blocked';
          statusIcon = '⛔';
          statusText = node.status;
        } else if (node.type === 'synth') {
          badgeClass = 'badge-synth';
          statusIcon = '🟡';
          statusText = 'WORKS — SYNTHETIC';
        }

        const isLast = i === STRATA_DATA.pipelineNodes.length - 1;
        return `
          <div class="pipeline-node" data-nav="pipeline" title="${node.notes}">
            <div class="tooltip-box">${node.notes}</div>
            <div class="node-step">Stage 0${i + 1}</div>
            <div class="node-title">${node.name}</div>
            <span class="badge ${badgeClass}">${statusIcon} ${statusText}</span>
          </div>
          ${!isLast ? '<div class="node-arrow">→</div>' : ''}
        `;
      }).join('');
    }

    // Render Recent Logs
    const logContainer = document.getElementById('recentLogsFeed');
    if (logContainer) {
      logContainer.innerHTML = STRATA_DATA.mockLogs.map(log => `
        <div class="log-entry ${log.type}">
          <span class="log-time">[${log.time}]</span>
          <span>${log.text}</span>
        </div>
      `).join('');
    }
  }

  // 3. Upload & Ingest View Handlers
  function initUploadView() {
    const dropzone = document.getElementById('droneDropzone');
    const fileInput = document.getElementById('videoFileInput');
    const uploadStatus = document.getElementById('uploadStatusNotice');
    const runPipelineBtn = document.getElementById('btnStartPipelineFromUpload');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          handleFileIngest(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFileIngest(e.target.files[0]);
        }
      });
    }

    function handleFileIngest(file) {
      if (uploadStatus) {
        uploadStatus.style.display = 'block';
        uploadStatus.innerHTML = `<strong>File Ingested:</strong> ${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB) — EXIF telemetry extracted. Note: Barometric altitude uncalibrated.`;
      }
    }

    if (runPipelineBtn) {
      runPipelineBtn.addEventListener('click', () => {
        navigateTo('pipeline');
        triggerPipelineExecution();
      });
    }
  }

  // 4. Pipeline Monitor Stepper & Simulation
  function triggerPipelineExecution() {
    state.pipeline.isRunning = true;
    state.pipeline.progress = 0;
    const progBar = document.getElementById('pipelineRunProgress');
    const runBtn = document.getElementById('btnRunPipeline');
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.textContent = 'Pipeline Running...';
    }

    const stepCards = document.querySelectorAll('.step-card');
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep >= stepCards.length) {
        clearInterval(interval);
        state.pipeline.isRunning = false;
        if (runBtn) {
          runBtn.disabled = false;
          runBtn.textContent = 'Re-Run Pipeline';
        }
        return;
      }

      stepCards.forEach((card, idx) => {
        if (idx === currentStep) {
          card.classList.add('running', 'open');
        } else if (idx < currentStep) {
          card.classList.remove('running');
        }
      });

      state.pipeline.progress = Math.round(((currentStep + 1) / stepCards.length) * 100);
      if (progBar) progBar.style.width = `${state.pipeline.progress}%`;

      currentStep++;
    }, 600);
  }

  const btnRunPipeline = document.getElementById('btnRunPipeline');
  if (btnRunPipeline) {
    btnRunPipeline.addEventListener('click', () => triggerPipelineExecution());
  }

  // Accordion click on step cards
  document.querySelectorAll('.step-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.step-card');
      card.classList.toggle('open');
    });
  });

  // Modal open for COLMAP instructions
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-install-instructions') || e.target.closest('.btn-install-instructions')) {
      e.preventDefault();
      if (els.modalBackdrop) els.modalBackdrop.classList.add('open');
    }
  });

  if (els.modalClose && els.modalBackdrop) {
    els.modalClose.addEventListener('click', () => els.modalBackdrop.classList.remove('open'));
    els.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.modalBackdrop) els.modalBackdrop.classList.remove('open');
    });
  }

  // 5. Map & GPS Canvas Visualizer
  function renderMapCanvas() {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 500;
    canvas.width = width;
    canvas.height = height;

    // Dark grid background
    ctx.fillStyle = '#090e17';
    ctx.fillRect(0, 0, width, height);

    // Survey grid lines
    ctx.strokeStyle = 'rgba(35, 48, 71, 0.4)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const ds = STRATA_DATA.datasets[state.currentMissionId];
    if (!ds || !ds.gpsAvailable || !ds.flightLines.length) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("No GPS telemetry coordinates in selected benchmark dataset", width / 2, height / 2);
      return;
    }

    // Convert lat/lng to canvas coords
    const bounds = ds.bounds;
    function project(lat, lng) {
      const pad = 60;
      const x = pad + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (width - pad * 2);
      const y = height - (pad + ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (height - pad * 2));
      return { x, y };
    }

    // Draw mission flight polylines
    if (ds.id === 'shitan') {
      // Multiple sub-missions (ms1..ms4)
      const subMissionColors = {
        ms1: '#06b6d4',
        ms2: '#10b981',
        ms3: '#f59e0b',
        ms4: '#a855f7'
      };

      const groups = {};
      ds.flightLines.forEach(pt => {
        if (!groups[pt.ms]) groups[pt.ms] = [];
        groups[pt.ms].push(pt);
      });

      Object.keys(groups).forEach(msKey => {
        const pts = groups[msKey];
        ctx.strokeStyle = subMissionColors[msKey] || '#06b6d4';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        pts.forEach((p, idx) => {
          const { x, y } = project(p.lat, p.lng);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Points
        pts.forEach(p => {
          const { x, y } = project(p.lat, p.lng);
          ctx.fillStyle = subMissionColors[msKey];
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    } else {
      // Single track (Aukerman)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ds.flightLines.forEach((p, idx) => {
        const { x, y } = project(p.lat, p.lng);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw waypoints
      ds.flightLines.forEach((p, idx) => {
        const { x, y } = project(p.lat, p.lng);
        ctx.fillStyle = idx === 0 ? '#10b981' : (idx === ds.flightLines.length - 1 ? '#ef4444' : '#06b6d4');
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(p.label || `wp-${idx+1}`, x + 8, y - 8);
      });
    }

    // Legend on canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(16, 16, 220, 90);
    ctx.strokeStyle = '#233047';
    ctx.strokeRect(16, 16, 220, 90);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("GPS Flight Path Track", 26, 36);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Dataset: ${ds.name}`, 26, 54);
    ctx.fillText(`Altitude Status: ${state.map.simulatedAltitude ? '3D Georeferenced (Simulated)' : '2D (Z missing)'}`, 26, 72);
    ctx.fillText(`Total Waypoints: ${ds.flightLines.length}`, 26, 90);
  }

  // Toggle simulated altitude button
  const btnToggleAlt = document.getElementById('btnToggleSimulatedAlt');
  if (btnToggleAlt) {
    btnToggleAlt.addEventListener('click', () => {
      state.map.simulatedAltitude = !state.map.simulatedAltitude;
      const banner = document.getElementById('mapAltitudeBanner');
      if (banner) {
        if (state.map.simulatedAltitude) {
          banner.className = 'honest-banner info';
          banner.innerHTML = `<strong>Full 3D georeferencing active:</strong> Simulated barometric Z altitude + simulated RTK ground control tie-in enabled.`;
          btnToggleAlt.textContent = "Revert to Default (No Altitude)";
        } else {
          banner.className = 'honest-banner';
          banner.innerHTML = `<strong>Altitude data unavailable — 2D positioning only:</strong> Aukerman and Shitan EXIF logs lack verified ellipsoidal Z height. 3D projection is constrained to flat projection plane.`;
          btnToggleAlt.textContent = "Test with Simulated Altitude";
        }
      }
      renderMapCanvas();
    });
  }

  // 6. 3D Viewer (Centerpiece: Plain CSS 3D Transforms + Canvas 2D/3D Wireframe)
  function init3DViewer() {
    const stage = document.getElementById('stage3DWrapper');
    const scene = document.getElementById('stage3DScene');
    const canvas = document.getElementById('canvas3d');
    if (!stage || !canvas) return;

    // View controls
    document.querySelectorAll('[data-view-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-view-mode]').forEach(b => b.classList.remove('active', 'btn-primary'));
        btn.classList.add('active', 'btn-primary');
        state.viewer3d.viewMode = btn.dataset.viewMode;
        render3DCanvas();
      });
    });

    // Zoom controls
    const zoomIn = document.getElementById('btn3dZoomIn');
    const zoomOut = document.getElementById('btn3dZoomOut');
    const reset = document.getElementById('btn3dReset');
    const measureBtn = document.getElementById('btn3dMeasure');

    if (zoomIn) zoomIn.addEventListener('click', () => {
      state.viewer3d.zoom = Math.min(state.viewer3d.zoom + 0.15, 2.5);
      updateSceneTransform();
      render3DCanvas();
    });

    if (zoomOut) zoomOut.addEventListener('click', () => {
      state.viewer3d.zoom = Math.max(state.viewer3d.zoom - 0.15, 0.5);
      updateSceneTransform();
      render3DCanvas();
    });

    if (reset) reset.addEventListener('click', () => {
      state.viewer3d.rotX = 55;
      state.viewer3d.rotY = 0;
      state.viewer3d.rotZ = 25;
      state.viewer3d.zoom = 1.0;
      state.viewer3d.measurePoints = [];
      state.viewer3d.measureDist = null;
      updateSceneTransform();
      render3DCanvas();
    });

    if (measureBtn) {
      measureBtn.addEventListener('click', () => {
        state.viewer3d.isMeasuring = !state.viewer3d.isMeasuring;
        state.viewer3d.measurePoints = [];
        state.viewer3d.measureDist = null;
        measureBtn.classList.toggle('btn-primary', state.viewer3d.isMeasuring);
        const notice = document.getElementById('measureNotice');
        if (notice) {
          notice.style.display = state.viewer3d.isMeasuring ? 'block' : 'none';
        }
        render3DCanvas();
      });
    }

    // Drag-to-rotate interaction
    stage.addEventListener('mousedown', (e) => {
      if (state.viewer3d.isMeasuring) {
        // Handle measuring click
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        if (state.viewer3d.measurePoints.length < 2) {
          state.viewer3d.measurePoints.push({ x: clickX, y: clickY });
          if (state.viewer3d.measurePoints.length === 2) {
            const p1 = state.viewer3d.measurePoints[0];
            const p2 = state.viewer3d.measurePoints[1];
            const pxDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            // Simulated meter conversion
            state.viewer3d.measureDist = (pxDist * 0.18).toFixed(1);
          }
        } else {
          state.viewer3d.measurePoints = [{ x: clickX, y: clickY }];
          state.viewer3d.measureDist = null;
        }
        render3DCanvas();
        return;
      }

      state.viewer3d.isDragging = true;
      state.viewer3d.lastMouseX = e.clientX;
      state.viewer3d.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.viewer3d.isDragging) return;
      const dx = e.clientX - state.viewer3d.lastMouseX;
      const dy = e.clientY - state.viewer3d.lastMouseY;
      state.viewer3d.lastMouseX = e.clientX;
      state.viewer3d.lastMouseY = e.clientY;

      state.viewer3d.rotZ += dx * 0.5;
      state.viewer3d.rotX = Math.max(10, Math.min(85, state.viewer3d.rotX - dy * 0.5));
      updateSceneTransform();
      render3DCanvas();
    });

    window.addEventListener('mouseup', () => {
      state.viewer3d.isDragging = false;
    });

    // Wheel to zoom
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      state.viewer3d.zoom = Math.max(0.5, Math.min(2.5, state.viewer3d.zoom + delta));
      updateSceneTransform();
      render3DCanvas();
    }, { passive: false });

    function updateSceneTransform() {
      if (scene) {
        scene.style.transform = `scale(${state.viewer3d.zoom})`;
      }
    }
  }

  function render3DCanvas() {
    const canvas = document.getElementById('canvas3d');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 520;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Coordinate origin at center
    const cx = width / 2;
    const cy = height / 2 + 30;

    const radX = (state.viewer3d.rotX * Math.PI) / 180;
    const radZ = (state.viewer3d.rotZ * Math.PI) / 180;
    const zoom = state.viewer3d.zoom;

    // 3D Isometric projection math
    function project3D(x, y, z) {
      // Rotate around Z axis
      const rx = x * Math.cos(radZ) - y * Math.sin(radZ);
      const ry = x * Math.sin(radZ) + y * Math.cos(radZ);
      // Tilt with X axis
      const px = rx * zoom;
      const py = (ry * Math.cos(radX) - z * Math.sin(radX)) * zoom;
      return {
        x: cx + px,
        y: cy + py
      };
    }

    const gridSize = 16;
    const spacing = 18;
    const half = (gridSize * spacing) / 2;

    // Synthetic terrain height function
    function getElevation(gx, gy) {
      const distCenter = Math.hypot(gx, gy);
      // Simulated building cluster in center + gentle hill
      if (Math.abs(gx) < 60 && Math.abs(gy) < 60) {
        return 38 + Math.sin(gx * 0.1) * 8;
      }
      return Math.sin(gx * 0.04) * 12 + Math.cos(gy * 0.04) * 10;
    }

    const mode = state.viewer3d.viewMode;

    if (mode === 'wireframe' || mode === 'mesh') {
      // Draw terrain grid
      ctx.lineWidth = 1;

      for (let i = 0; i <= gridSize; i++) {
        const x = -half + i * spacing;
        ctx.beginPath();
        for (let j = 0; j <= gridSize; j++) {
          const y = -half + j * spacing;
          const z = getElevation(x, y);
          const p = project3D(x, y, z);
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = mode === 'mesh' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(148, 163, 184, 0.35)';
        ctx.stroke();
      }

      for (let j = 0; j <= gridSize; j++) {
        const y = -half + j * spacing;
        ctx.beginPath();
        for (let i = 0; i <= gridSize; i++) {
          const x = -half + i * spacing;
          const z = getElevation(x, y);
          const p = project3D(x, y, z);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = mode === 'mesh' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(148, 163, 184, 0.35)';
        ctx.stroke();
      }

      // Draw extruded building block in center (synthetic structure)
      const bx = 0, by = 0, bw = 50, bh = 50, bz = 60;
      const bPoints = [
        project3D(bx - bw/2, by - bh/2, 0),
        project3D(bx + bw/2, by - bh/2, 0),
        project3D(bx + bw/2, by + bh/2, 0),
        project3D(bx - bw/2, by + bh/2, 0),
        project3D(bx - bw/2, by - bh/2, bz),
        project3D(bx + bw/2, by - bh/2, bz),
        project3D(bx + bw/2, by + bh/2, bz),
        project3D(bx - bw/2, by + bh/2, bz)
      ];

      if (mode === 'mesh') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        // Roof face
        ctx.beginPath();
        ctx.moveTo(bPoints[4].x, bPoints[4].y);
        ctx.lineTo(bPoints[5].x, bPoints[5].y);
        ctx.lineTo(bPoints[6].x, bPoints[6].y);
        ctx.lineTo(bPoints[7].x, bPoints[7].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Building columns
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(bPoints[k].x, bPoints[k].y);
        ctx.lineTo(bPoints[k+4].x, bPoints[k+4].y);
        ctx.stroke();
      }
    }

    if (mode === 'pointcloud') {
      // Draw point cloud dots
      for (let i = 0; i <= gridSize; i++) {
        const x = -half + i * spacing;
        for (let j = 0; j <= gridSize; j++) {
          const y = -half + j * spacing;
          const z = getElevation(x, y);
          const p = project3D(x, y, z);
          ctx.fillStyle = z > 20 ? '#06b6d4' : '#10b981';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Camera pose pyramids (simulated drone flight trajectory)
    const droneWaypoints = [
      { x: -90, y: -70, z: 95 },
      { x: -30, y: -50, z: 95 },
      { x: 30, y: -30, z: 95 },
      { x: 90, y: -10, z: 95 }
    ];

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    droneWaypoints.forEach((wp, idx) => {
      const pCam = project3D(wp.x, wp.y, wp.z);
      // Small pyramid frustum
      const f1 = project3D(wp.x - 12, wp.y - 12, wp.z - 20);
      const f2 = project3D(wp.x + 12, wp.y - 12, wp.z - 20);
      const f3 = project3D(wp.x + 12, wp.y + 12, wp.z - 20);
      const f4 = project3D(wp.x - 12, wp.y + 12, wp.z - 20);

      ctx.beginPath();
      ctx.moveTo(pCam.x, pCam.y); ctx.lineTo(f1.x, f1.y);
      ctx.moveTo(pCam.x, pCam.y); ctx.lineTo(f2.x, f2.y);
      ctx.moveTo(pCam.x, pCam.y); ctx.lineTo(f3.x, f3.y);
      ctx.moveTo(pCam.x, pCam.y); ctx.lineTo(f4.x, f4.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y);
      ctx.lineTo(f3.x, f3.y); ctx.lineTo(f4.x, f4.y);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(pCam.x, pCam.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '10px monospace';
      ctx.fillText(`Cam-${idx+1}`, pCam.x + 6, pCam.y - 6);
    });

    // Draw Measurement Ruler if active
    if (state.viewer3d.measurePoints.length > 0) {
      state.viewer3d.measurePoints.forEach((pt, i) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`P${i+1}`, pt.x + 8, pt.y - 8);
      });

      if (state.viewer3d.measurePoints.length === 2) {
        const p1 = state.viewer3d.measurePoints[0];
        const p2 = state.viewer3d.measurePoints[1];
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Distance label badge
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const distText = `${state.viewer3d.measureDist} m (Estimated — uncalibrated)`;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(midX - 90, midY - 24, 180, 22);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(midX - 90, midY - 24, 180, 22);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(distText, midX, midY - 9);
      }
    }
  }

  // 7. Detections & Environment Gallery
  function renderDetectionsGallery() {
    const container = document.getElementById('detectionsGalleryGrid');
    if (!container) return;

    let frames = STRATA_DATA.sampleFrames;
    if (state.detections.filterMission !== 'all') {
      frames = frames.filter(f => f.mission.toLowerCase().includes(state.detections.filterMission));
    }

    container.innerHTML = frames.map(frm => `
      <div class="frame-card">
        <div class="frame-canvas-wrap">
          <canvas id="det-canvas-${frm.id}"></canvas>
          ${frm.dynamicWarning && state.detections.showDynamicWarning ? `
            <div style="position:absolute; bottom:8px; left:8px; right:8px; background:rgba(239, 68, 68, 0.88); color:#fff; padding:4px 8px; border-radius:4px; font-size:0.72rem; font-weight:600; display:flex; align-items:center; gap:4px;">
              <span>⚠️</span>
              <span>Dynamic object: May cause reconstruction artifacts</span>
            </div>
          ` : ''}
          <div style="position:absolute; top:8px; right:8px; background:rgba(15,23,42,0.8); border:1px solid #233047; padding:2px 6px; border-radius:4px; font-size:0.75rem; color:${frm.qualityScore > 75 ? '#10b981' : '#f59e0b'}; font-weight:700;">
            Score: ${frm.qualityScore}/100
          </div>
        </div>
        <div class="frame-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:0.9rem;">Frame #${frm.index} (${frm.mission})</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${frm.condition}</span>
          </div>
          <div class="tag-cloud" style="margin-top:6px;">
            ${frm.tags.map(t => `<span class="env-tag">${t}</span>`).join('')}
          </div>
          ${frm.dynamicNote ? `<div style="font-size:0.75rem; color:#f87171; margin-top:6px;">${frm.dynamicNote}</div>` : ''}
        </div>
      </div>
    `).join('');

    // Draw frame synthetic thumbnail
    frames.forEach(frm => {
      const c = document.getElementById(`det-canvas-${frm.id}`);
      if (!c) return;
      const ctx = c.getContext('2d');
      const w = c.parentElement.clientWidth;
      const h = c.parentElement.clientHeight || 180;
      c.width = w;
      c.height = h;

      // Drone view gradient (ground + roof/road)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a293f');
      grad.addColorStop(1, '#0e1826');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Grid/texture lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      // Draw bounding boxes if toggle on
      if (state.detections.showBBoxes) {
        frm.detections.forEach(det => {
          const bx = (det.box[0] / 100) * w;
          const by = (det.box[1] / 100) * h;
          const bw = (det.box[2] / 100) * w;
          const bh = (det.box[3] / 100) * h;

          ctx.strokeStyle = det.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, bw, bh);

          ctx.fillStyle = det.color;
          ctx.fillRect(bx, by - 16, Math.min(bw, 110), 16);

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(`${det.label} ${(det.conf * 100).toFixed(0)}%`, bx + 3, by - 4);
        });
      }
    });
  }

  // Detections filter handlers
  const detFilterMission = document.getElementById('detFilterMission');
  if (detFilterMission) {
    detFilterMission.addEventListener('change', (e) => {
      state.detections.filterMission = e.target.value;
      renderDetectionsGallery();
    });
  }

  const toggleBBoxes = document.getElementById('toggleBBoxes');
  if (toggleBBoxes) {
    toggleBBoxes.addEventListener('change', (e) => {
      state.detections.showBBoxes = e.target.checked;
      renderDetectionsGallery();
    });
  }

  const toggleDynamicWarning = document.getElementById('toggleDynamicWarning');
  if (toggleDynamicWarning) {
    toggleDynamicWarning.addEventListener('change', (e) => {
      state.detections.showDynamicWarning = e.target.checked;
      renderDetectionsGallery();
    });
  }

  // 8. Mission Planner Canvas & Simulator
  function renderPlannerCanvas() {
    const canvas = document.getElementById('plannerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 400;
    canvas.width = width;
    canvas.height = height;

    // Dark canvas background
    ctx.fillStyle = '#090e17';
    ctx.fillRect(0, 0, width, height);

    // Survey grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Draw AOI polygon
    const aoi = [
      { x: width * 0.15, y: height * 0.15 },
      { x: width * 0.85, y: height * 0.15 },
      { x: width * 0.80, y: height * 0.85 },
      { x: width * 0.20, y: height * 0.80 }
    ];

    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.beginPath();
    aoi.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Generate Lawnmower (serpentine) single-pass flight path
    const numLines = 6;
    const yMin = height * 0.22;
    const yMax = height * 0.78;
    const yStep = (yMax - yMin) / (numLines - 1);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let toggleRight = true;
    for (let i = 0; i < numLines; i++) {
      const y = yMin + i * yStep;
      const x1 = width * 0.22;
      const x2 = width * 0.78;

      if (toggleRight) {
        if (i === 0) ctx.moveTo(x1, y);
        else ctx.lineTo(x1, y);
        ctx.lineTo(x2, y);
      } else {
        ctx.lineTo(x2, y);
        ctx.lineTo(x1, y);
      }
      toggleRight = !toggleRight;
    }
    ctx.stroke();

    // Flight direction arrows & start/end markers
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(width * 0.22, yMin, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText("TAKEOFF", width * 0.22 - 20, yMin - 12);

    // Update estimated metrics on UI
    const elGsd = document.getElementById('plannerEstGSD');
    if (elGsd) {
      const alt = state.planner.altitude;
      const gsd = (alt * 0.035).toFixed(2);
      elGsd.textContent = `${gsd} cm/px`;
    }
  }

  // Planner altitude/speed inputs
  const planAltInput = document.getElementById('planAltInput');
  if (planAltInput) {
    planAltInput.addEventListener('input', (e) => {
      state.planner.altitude = parseInt(e.target.value, 10);
      const valDisplay = document.getElementById('planAltVal');
      if (valDisplay) valDisplay.textContent = `${state.planner.altitude} m`;
      renderPlannerCanvas();
    });
  }

  // Simulate Mission Button
  const btnSimulateMission = document.getElementById('btnSimulateMission');
  if (btnSimulateMission) {
    btnSimulateMission.addEventListener('click', () => {
      const logArea = document.getElementById('plannerSimLog');
      if (!logArea) return;
      btnSimulateMission.disabled = true;
      btnSimulateMission.textContent = 'Simulating Mission...';
      logArea.innerHTML = '<span style="color:#06b6d4;">[00:00] Initializing synthetic waypoint flight controller...</span><br>';

      setTimeout(() => {
        logArea.innerHTML += '<span style="color:#10b981;">[00:05] Waypoints 1-6 calculated. GSD verified: 2.1 cm/px.</span><br>';
      }, 500);

      setTimeout(() => {
        logArea.innerHTML += '<span style="color:#f59e0b;">[00:12] Battery reserve check: estimated consumption 34.2% on DJI Mavic 3.</span><br>';
      }, 1000);

      setTimeout(() => {
        logArea.innerHTML += '<span style="color:#10b981;">[00:18] Mission simulation complete. Status: VALIDATED (SYNTHETIC DATA).</span><br>';
        btnSimulateMission.disabled = false;
        btnSimulateMission.textContent = 'Run Mission Simulation';
      }, 1500);
    });
  }

  // 9. Capability Matrix Table Sorting & Filtering
  function initCapabilityMatrix() {
    const tbody = document.getElementById('capMatrixTableBody');
    if (!tbody) return;

    function renderRows(filter = 'all') {
      let items = STRATA_DATA.capabilities;
      if (filter !== 'all') {
        items = items.filter(c => {
          if (filter === 'works') return c.status.includes('WORKS');
          if (filter === 'partial') return c.status.includes('PARTIAL');
          if (filter === 'blocked') return c.status.includes('REQUIRES');
          return true;
        });
      }

      tbody.innerHTML = items.map(c => {
        let badgeClass = 'badge-works';
        let statusIcon = '✅';
        if (c.status.includes('REQUIRES')) {
          badgeClass = 'badge-blocked';
          statusIcon = '⛔';
        } else if (c.status.includes('PARTIAL')) {
          badgeClass = 'badge-synth';
          statusIcon = '🟡';
        } else if (c.validation.includes('Synthetic')) {
          badgeClass = 'badge-synth';
          statusIcon = '🟡';
        }

        return `
          <tr>
            <td><strong>${c.capability}</strong></td>
            <td><span class="badge ${badgeClass}">${statusIcon} ${c.status}</span></td>
            <td><span style="color:var(--text-muted); font-size:0.82rem;">${c.validation}</span></td>
            <td style="color:var(--text-dim); font-size:0.8rem;">${c.note}</td>
          </tr>
        `;
      }).join('');
    }

    renderRows('all');

    document.querySelectorAll('[data-cap-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-cap-filter]').forEach(b => b.classList.remove('active', 'btn-primary'));
        btn.classList.add('active', 'btn-primary');
        renderRows(btn.dataset.capFilter);
      });
    });
  }

  // 10. Reports View Exports
  const btnExportPdf = document.getElementById('btnExportPdf');
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      window.print();
    });
  }

  const btnExportJson = document.getElementById('btnExportJson');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const payload = {
        project: "strata",
        problemStatement: "SIH PS 17: Single-Pass Drone Video to 3D Model",
        exportTimestamp: new Date().toISOString(),
        dataset: STRATA_DATA.datasets[state.currentMissionId],
        capabilityMatrix: STRATA_DATA.capabilities,
        honestAudit: {
          realValidatedCount: 5,
          syntheticValidatedCount: 4,
          externalBlockedCount: 8,
          criticalDependenciesPending: ["COLMAP", "OpenMVS", "FFmpeg", "RTK Z Altitude"]
        }
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strata-integration-audit-${state.currentMissionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Initialize components on launch
  initDashboard();
  initUploadView();
  init3DViewer();
  initCapabilityMatrix();
  updateMissionData();
});
