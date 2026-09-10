// strata — System Seed Data & Datasets

const STRATA_DATA = {
  datasets: {
    "aukerman": {
      id: "aukerman",
      name: "Aukerman Dataset",
      totalImages: 77,
      sensor: "Sony Alpha 7R (Exmor R CMOS)",
      resolution: "7952 x 5304",
      fps: "Single Frames / Intermittent Pass",
      duration: "03m 15s equivalent",
      location: "Ohio Survey Grid (~41.304°N, -81.750°W)",
      gpsAvailable: true,
      hasAltitude: false,
      altitudeWarning: "Altitude data unavailable in EXIF — 2D positioning only (ellipsoidal/barometric Z missing)",
      flightLines: [
        { lat: 41.3041, lng: -81.7512, label: "wp-01" },
        { lat: 41.3045, lng: -81.7508, label: "wp-02" },
        { lat: 41.3051, lng: -81.7499, label: "wp-03" },
        { lat: 41.3056, lng: -81.7492, label: "wp-04" },
        { lat: 41.3060, lng: -81.7485, label: "wp-05" },
        { lat: 41.3058, lng: -81.7475, label: "wp-06" },
        { lat: 41.3051, lng: -81.7478, label: "wp-07" },
        { lat: 41.3044, lng: -81.7486, label: "wp-08" },
        { lat: 41.3039, lng: -81.7498, label: "wp-09" }
      ],
      bounds: { minLat: 41.3035, maxLat: 41.3065, minLng: -81.7520, maxLng: -81.7470 },
      qualityStats: {
        avgSharpness: 86.4,
        blurFlaggedCount: 5,
        exposureMean: 124,
        dynamicObjectsCount: 3
      }
    },
    "shitan": {
      id: "shitan",
      name: "Shitan TW — ms1..ms4",
      totalImages: 493,
      sensor: "DJI FC220 / Mavic 3 Hasselblad L2D-20c",
      resolution: "4000 x 3000 (12MP)",
      fps: "29.97 fps keyframed",
      duration: "14m 42s total",
      location: "Miaoli County, Taiwan (~24.529°N, 120.952°E)",
      gpsAvailable: true,
      hasAltitude: false,
      altitudeWarning: "Relative barometric drift flagged; no RTK base station tie-in — 2D positioning only",
      subMissions: [
        { name: "ms1", count: 145, color: "#06b6d4" },
        { name: "ms2", count: 155, color: "#10b981" },
        { name: "ms3", count: 92, color: "#f59e0b" },
        { name: "ms4", count: 101, color: "#a855f7" }
      ],
      flightLines: [
        // ms1 track
        { lat: 24.5280, lng: 120.9500, ms: "ms1" },
        { lat: 24.5295, lng: 120.9515, ms: "ms1" },
        { lat: 24.5310, lng: 120.9530, ms: "ms1" },
        // ms2 track
        { lat: 24.5312, lng: 120.9538, ms: "ms2" },
        { lat: 24.5298, lng: 120.9545, ms: "ms2" },
        { lat: 24.5285, lng: 120.9532, ms: "ms2" },
        // ms3 track
        { lat: 24.5275, lng: 120.9520, ms: "ms3" },
        { lat: 24.5288, lng: 120.9510, ms: "ms3" },
        // ms4 track
        { lat: 24.5302, lng: 120.9502, ms: "ms4" },
        { lat: 24.5318, lng: 120.9518, ms: "ms4" }
      ],
      bounds: { minLat: 24.5260, maxLat: 24.5330, minLng: 120.9480, maxLng: 120.9560 },
      qualityStats: {
        avgSharpness: 91.2,
        blurFlaggedCount: 14,
        exposureMean: 138,
        dynamicObjectsCount: 9
      }
    },
    "visdrone": {
      id: "visdrone",
      name: "VisDrone Benchmark",
      totalImages: 10209,
      sensor: "Multi-drone heterogeneous fleet",
      resolution: "Variable (~1360 x 765)",
      fps: "30 fps",
      duration: "01h 12m sequence",
      location: "Benchmark Urban Corpus (Multi-city)",
      gpsAvailable: false,
      hasAltitude: false,
      altitudeWarning: "Benchmark video extract: GPS EXIF stripped — spatial georeferencing disabled",
      flightLines: [],
      bounds: null,
      qualityStats: {
        avgSharpness: 78.5,
        blurFlaggedCount: 420,
        exposureMean: 112,
        dynamicObjectsCount: 840
      }
    }
  },

  // 17 exact capabilities from prompt
  capabilities: [
    { capability: "Image quality analysis", status: "WORKS", validation: "Real dataset validated", note: "Laplacian variance & gradient sharpness evaluated on 570+ real frames." },
    { capability: "Environmental detection", status: "WORKS", validation: "Real dataset validated", note: "Dark channel prior (fog/haze), luminance histograms, shadow contrast." },
    { capability: "Object detection (classical)", status: "WORKS", validation: "Real dataset validated", note: "Background subtraction, edge clustering, contour detection on drone imagery." },
    { capability: "GPS extraction", status: "PARTIAL", validation: "Real dataset validated (no altitude)", note: "Lat/Lon telemetry parsed from EXIF tags; altitude missing/uncalibrated in source logs." },
    { capability: "Mission simulation", status: "WORKS", validation: "Synthetic data validated", note: "Waypoint interpolation, GSD coverage projection, overlap calculation." },
    { capability: "Battery estimation", status: "WORKS", validation: "Synthetic data validated", note: "Empirical power curves based on DJI Matrice 300 & Mavic 3 specifications." },
    { capability: "Path optimization", status: "WORKS", validation: "Synthetic data validated", note: "Single-pass boustrophedon (lawnmower) pathing with cross-wind compensation." },
    { capability: "Risk assessment", status: "WORKS", validation: "Synthetic data validated", note: "Heuristic scoring of lighting variance, solar angle, and feature match risk." },
    { capability: "Report generation", status: "WORKS", validation: "Synthetic data validated", note: "Automated synthesis of telemetry, audit logs, and known limitations appendix." },
    { capability: "SfM / camera pose", status: "REQUIRES COLMAP", validation: "Not validated", note: "Requires COLMAP installation for bundle adjustment and camera pose trajectory." },
    { capability: "Sparse reconstruction", status: "REQUIRES COLMAP", validation: "Not validated", note: "Needs SIFT feature matching and triangulation daemon." },
    { capability: "Dense reconstruction", status: "REQUIRES OpenMVS", validation: "Not validated", note: "Requires OpenMVS patch-match depth maps and multi-view stereo fusion." },
    { capability: "Depth estimation", status: "REQUIRES AI MODEL", validation: "Not validated", note: "Pending monocular depth model integration (Depth Anything V2)." },
    { capability: "Semantic segmentation", status: "REQUIRES AI MODEL (SAM2)", validation: "Not validated", note: "Requires Segment Anything 2 (SAM2) or Mask2Former GPU checkpoint." },
    { capability: "Change detection", status: "REQUIRES RECONSTRUCTION", validation: "Not validated", note: "Requires co-registered 3D point cloud or DSM difference map." },
    { capability: "Metric accuracy", status: "REQUIRES CALIBRATION", validation: "Not validated", note: "Requires camera matrix (fx, fy, cx, cy), radial distortion, and LiDAR GCPs." },
    { capability: "Video frame extraction", status: "REQUIRES FFMPEG", validation: "Not testable (no codec support)", note: "Requires system FFmpeg binary with H.264/H.265 hardware decoding." }
  ],

  // 14 pipeline nodes
  pipelineNodes: [
    { id: "input", name: "INPUT (video/images)", status: "WORKS", type: "real", notes: "Ingests raw MP4/MOV or image directories" },
    { id: "frame_quality", name: "Frame Quality Analysis", status: "WORKS", type: "real", notes: "Laplacian blur & exposure distribution scoring" },
    { id: "env_intel", name: "Environmental Intelligence", status: "WORKS", type: "real", notes: "Fog, haze, lowlight, and shadow detection" },
    { id: "obj_detect", name: "Object Detection (classical)", status: "WORKS", type: "real", notes: "Vehicles, structures, moving objects tracking" },
    { id: "feat_extract", name: "Feature Extraction", status: "REQUIRES COLMAP", type: "blocked", notes: "SIFT / SuperPoint feature detection" },
    { id: "camera_pose", name: "Camera Pose (SfM)", status: "REQUIRES COLMAP", type: "blocked", notes: "Sequential structure-from-motion bundle adjustment" },
    { id: "sparse_recon", name: "Sparse Reconstruction", status: "REQUIRES COLMAP", type: "blocked", notes: "Triangulated 3D tie points" },
    { id: "dense_recon", name: "Dense Reconstruction", status: "REQUIRES OpenMVS", type: "blocked", notes: "Multi-view stereo dense point cloud" },
    { id: "mesh_gen", name: "Mesh Generation", status: "WORKS (synthetic)", type: "synth", notes: "Poisson surface mesh & Delaunay tetrahedralization" },
    { id: "texture_gen", name: "Texture Generation", status: "WORKS (synthetic)", type: "synth", notes: "UV unwrapping and photometric texture blending" },
    { id: "semantic", name: "Semantic Understanding", status: "WORKS (synthetic)", type: "synth", notes: "Building footprint & terrain class assignment" },
    { id: "georef", name: "Geospatial Georeferencing", status: "REQUIRES ALTITUDE/GCP", type: "blocked", notes: "Full 3D coordinate transformation requires Z elevation" },
    { id: "damage_assess", name: "Damage Assessment", status: "WORKS (synthetic)", type: "synth", notes: "Structural anomaly and crack heuristics" },
    { id: "mission_plan", name: "Mission Planning", status: "WORKS (synthetic)", type: "synth", notes: "Single-pass survey trajectory optimizer" },
    { id: "reports", name: "Reports / Exports", status: "WORKS", type: "synth", notes: "Compliant survey PDF & telemetry bundle export" }
  ],

  // Sample frames for detections
  sampleFrames: [
    {
      id: "frm-042",
      mission: "Aukerman",
      index: 42,
      qualityScore: 94,
      sharpness: "High (Laplacian: 184.2)",
      condition: "Clear Sunlight",
      tags: ["Sunlight", "Shadows: Moderate"],
      dynamicWarning: false,
      detections: [
        { label: "Structure", box: [20, 25, 45, 40], color: "#06b6d4", conf: 0.94 },
        { label: "Vegetation", box: [5, 65, 35, 30], color: "#10b981", conf: 0.91 }
      ]
    },
    {
      id: "frm-078",
      mission: "Shitan ms1",
      index: 78,
      qualityScore: 68,
      sharpness: "Moderate (Laplacian: 82.5)",
      condition: "Light Haze",
      tags: ["Haze 28%", "Dynamic Object"],
      dynamicWarning: true,
      dynamicNote: "Moving white pickup truck in lane 2 — may cause photogrammetry ghosting",
      detections: [
        { label: "Moving Vehicle", box: [52, 48, 22, 16], color: "#ef4444", conf: 0.96 },
        { label: "Road Surface", box: [10, 40, 80, 50], color: "#94a3b8", conf: 0.88 }
      ]
    },
    {
      id: "frm-115",
      mission: "Shitan ms2",
      index: 115,
      qualityScore: 89,
      sharpness: "Sharp (Laplacian: 162.0)",
      condition: "Overcast",
      tags: ["Uniform Light", "Ideal SfM Overlap"],
      dynamicWarning: false,
      detections: [
        { label: "Commercial Building", box: [25, 15, 50, 55], color: "#06b6d4", conf: 0.98 },
        { label: "Parked Car", box: [72, 70, 15, 12], color: "#3b82f6", conf: 0.89 }
      ]
    },
    {
      id: "frm-164",
      mission: "Shitan ms3",
      index: 164,
      qualityScore: 54,
      sharpness: "Flagged Blur (Laplacian: 38.1)",
      condition: "Motion Slew",
      tags: ["High Angular Rate", "Flagged Review"],
      dynamicWarning: false,
      detections: [
        { label: "Vegetation (Blurred)", box: [15, 20, 70, 60], color: "#f59e0b", conf: 0.72 }
      ]
    },
    {
      id: "frm-201",
      mission: "Shitan ms4",
      index: 201,
      qualityScore: 92,
      sharpness: "Sharp (Laplacian: 178.4)",
      condition: "Direct Noon",
      tags: ["High Contrast", "Pedestrian Tracked"],
      dynamicWarning: true,
      dynamicNote: "Pedestrian moving on sidewalk — dynamic object exclusion recommended for dense matching",
      detections: [
        { label: "Pedestrian", box: [45, 62, 8, 14], color: "#ef4444", conf: 0.86 },
        { label: "Building Facade", box: [10, 10, 80, 50], color: "#06b6d4", conf: 0.95 }
      ]
    },
    {
      id: "frm-280",
      mission: "VisDrone",
      index: 280,
      qualityScore: 82,
      sharpness: "Good (Laplacian: 135.6)",
      condition: "Dense Urban Traffic",
      tags: ["High Dynamic Density", "Multi-vehicle"],
      dynamicWarning: true,
      dynamicNote: "12+ moving vehicles identified — photogrammetric reconstruction will require dynamic masking",
      detections: [
        { label: "Vehicle 1", box: [30, 40, 12, 10], color: "#ef4444", conf: 0.93 },
        { label: "Vehicle 2", box: [48, 52, 14, 11], color: "#ef4444", conf: 0.91 },
        { label: "Intersection", box: [20, 30, 60, 50], color: "#94a3b8", conf: 0.85 }
      ]
    }
  ],

  // Recent logs
  mockLogs: [
    { time: "14:24:12", type: "info", text: "Aukerman-77: Telemetry parsed. Lat/Lon bounds registered (2D only, no Z altitude in EXIF)." },
    { time: "14:23:45", type: "warn", text: "Quality Audit: 5 frames flagged below Laplacian sharpness threshold (blur < 45.0)." },
    { time: "14:23:18", type: "danger", text: "Pipeline Step 05 (COLMAP SfM): Binary 'colmap' not located on system path. Stage halted honestly." },
    { time: "14:22:50", type: "warn", text: "3D Viewer: Loaded fallback synthetic wireframe mesh (142.5k vertices) labeled clearly as simulated." },
    { time: "14:22:04", type: "info", text: "Environmental Analyzer: Dark channel prior haze index: 0.12 (clear atmosphere, good optical conditions)." },
    { time: "14:21:12", type: "danger", text: "OpenMVS dense reconstruction unavailable: install OpenMVS toolchain to generate point clouds." },
    { time: "14:20:30", type: "info", text: "Classical Object Detector: 14 dynamic ground targets identified across 493 drone frames." }
  ]
};
