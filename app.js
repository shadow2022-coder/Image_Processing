const { useState, useEffect, useRef, useCallback } = React;

// ---------------------------------------------------------------------------
// ICONS (Inline SVGs to avoid external dependencies)
// ---------------------------------------------------------------------------
const Icon = ({ children, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {children}
    </svg>
);

const Icons = {
    Camera: (props) => <Icon {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></Icon>,
    Activity: (props) => <Icon {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>,
    Upload: (props) => <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>,
    Download: (props) => <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>,
    RefreshCw: (props) => <Icon {...props}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Icon>,
    ImageIcon: (props) => <Icon {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Icon>,
    Monitor: (props) => <Icon {...props}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></Icon>,
    Clock: (props) => <Icon {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
    Maximize2: (props) => <Icon {...props}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></Icon>,
    ArrowRightLeft: (props) => <Icon {...props}><path d="m16 7 5 5-5 5"/><path d="M4 12h17"/><path d="m8 17-5-5 5-5"/></Icon>,
    FileImage: (props) => <Icon {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></Icon>,
};

// ---------------------------------------------------------------------------
// CONSTANTS & TYPES
// ---------------------------------------------------------------------------

const FilterType = {
    NONE: 'Normal',
    GRAYSCALE: 'Grayscale',
    EDGE_DETECTION: 'Edge Detection',
    INVERT: 'Invert',
    SEPIA: 'Sepia',
    THRESHOLD: 'Threshold',
    WARM: 'Warm Color',
    COOL: 'Cool Color'
};

const INITIAL_STATS = {
    width: 0,
    height: 0,
    fps: 0,
    processingTimeMs: 0
};

const FILTERS = [
    { type: FilterType.NONE, label: 'Original', description: 'Raw camera feed' },
    { type: FilterType.GRAYSCALE, label: 'Grayscale', description: 'Luminance conversion' },
    { type: FilterType.EDGE_DETECTION, label: 'Edge Detect', description: 'Sobel operator' },
    { type: FilterType.THRESHOLD, label: 'Threshold', description: 'Binary black & white' },
    { type: FilterType.INVERT, label: 'Invert', description: 'Negative colors' },
    { type: FilterType.SEPIA, label: 'Sepia', description: 'Vintage color scale' },
    { type: FilterType.WARM, label: 'Warm Scale', description: 'Red/Yellow color boost' },
    { type: FilterType.COOL, label: 'Cool Scale', description: 'Blue/Cyan color boost' },
];

// Use a fixed seed to get the same image every time
const DEFAULT_IMAGE_URL = 'https://picsum.photos/seed/edgedetect/800/600';

// ---------------------------------------------------------------------------
// IMAGE PROCESSING LOGIC
// ---------------------------------------------------------------------------

const applyFilter = (ctx, width, height, type) => {
    const startTime = performance.now();
    
    if (type === FilterType.NONE) return 0;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const len = data.length;

    if (type === FilterType.GRAYSCALE) {
        for (let i = 0; i < len; i += 4) {
            const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = avg;     // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
        }
    } 
    else if (type === FilterType.SEPIA) {
        for (let i = 0; i < len; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
    }
    else if (type === FilterType.INVERT) {
        for (let i = 0; i < len; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    }
    else if (type === FilterType.THRESHOLD) {
        const threshold = 128;
        for (let i = 0; i < len; i += 4) {
            const avg = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            const val = avg >= threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
        }
    }
    else if (type === FilterType.WARM) {
        for (let i = 0; i < len; i += 4) {
            data[i] = Math.min(255, data[i] + 40);     // R
            data[i + 1] = Math.min(255, data[i + 1] + 10); // G
            data[i + 2] = Math.max(0, data[i + 2] - 20); // B
        }
    }
    else if (type === FilterType.COOL) {
        for (let i = 0; i < len; i += 4) {
            data[i] = Math.max(0, data[i] - 10);      // R
            data[i + 1] = Math.min(255, data[i + 1] + 10); // G
            data[i + 2] = Math.min(255, data[i + 2] + 50); // B
        }
    }
    else if (type === FilterType.EDGE_DETECTION) {
        // Simple Sobel Operator implementation
        const grayData = new Uint8Array(width * height);
        // 1. Grayscale
        for (let i = 0; i < len; i += 4) {
            grayData[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const output = new Uint8ClampedArray(len);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = (y * width + x);
                const p00 = grayData[i - width - 1], p01 = grayData[i - width], p02 = grayData[i - width + 1];
                const p10 = grayData[i - 1], p12 = grayData[i + 1];
                const p20 = grayData[i + width - 1], p21 = grayData[i + width], p22 = grayData[i + width + 1];

                const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
                const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const val = magnitude > 50 ? Math.min(255, magnitude) : 0;

                const idx = i * 4;
                output[idx] = val;
                output[idx + 1] = val;
                output[idx + 2] = val;
                output[idx + 3] = 255;
            }
        }
        for(let j=0; j<len; j++) data[j] = output[j];
    }

    ctx.putImageData(imageData, 0, 0);
    return performance.now() - startTime;
};

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

const Header = () => {
    return (
        <header className="w-full bg-slate-800 border-b border-slate-700 py-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Icons.Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">EdgeDetect <span className="text-blue-400">Viewer</span></h1>
                    <p className="text-xs text-slate-400 font-medium">Native Bridge & Debug Interface</p>
                </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-300 font-mono">SYSTEM_ACTIVE</span>
                </div>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <Icons.Activity className="w-5 h-5" />
                </a>
            </div>
        </header>
    );
};

const ImageProcessor = () => {
    const canvasRef = useRef(null);
    const [activeFilter, setActiveFilter] = useState(FilterType.NONE);
    const [stats, setStats] = useState(INITIAL_STATS);
    const [imageSrc, setImageSrc] = useState(DEFAULT_IMAGE_URL);
    const [isProcessing, setIsProcessing] = useState(false);

    const processImage = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        setIsProcessing(true);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const MAX_WIDTH = 1024;
            const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
            
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const duration = applyFilter(ctx, canvas.width, canvas.height, activeFilter);

            setStats({
                width: canvas.width,
                height: canvas.height,
                fps: duration > 0 ? Math.round(1000 / duration) : 60,
                processingTimeMs: Number(duration.toFixed(2))
            });
            setIsProcessing(false);
        };
        img.onerror = () => setIsProcessing(false);
    }, [activeFilter, imageSrc]);

    useEffect(() => {
        processImage();
    }, [processImage]);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setImageSrc(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLoadSample = () => setImageSrc(DEFAULT_IMAGE_URL);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = `processed_${activeFilter.toLowerCase().replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    return (
        <main className="flex flex-col lg:flex-row h-[calc(100vh-73px)] overflow-hidden bg-slate-900">
            <section className="flex-1 flex flex-col p-4 gap-4 min-w-0 overflow-y-auto lg:overflow-hidden">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px] lg:min-h-0">
                    {/* Original Image Pane */}
                    <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden group">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-500 group-hover:bg-slate-400 transition-colors"></div>
                                <span className="text-xs font-bold text-slate-400 tracking-wider">ORIGINAL SOURCE</span>
                            </div>
                        </div>
                        <div className="flex-1 relative p-4 flex items-center justify-center bg-slate-950/50 overflow-hidden">
                            <img src={imageSrc} alt="Original Input" className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />
                        </div>
                    </div>

                    {/* Processed Image Pane */}
                    <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden relative group">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-blue-400 tracking-wider">PROCESSED OUTPUT</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded uppercase">
                                {activeFilter}
                            </span>
                        </div>
                        <div className="flex-1 relative p-4 flex items-center justify-center bg-slate-950/50 overflow-hidden">
                            {isProcessing && (
                                <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
                                    <Icons.RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                            )}
                            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />
                            
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                                <div className="bg-black/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-4 shadow-lg">
                                     <div className="flex items-center gap-2">
                                        <Icons.Monitor className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs font-mono text-slate-200">{Math.round(stats.width)}×{Math.round(stats.height)}</span>
                                     </div>
                                     <div className="w-px h-3 bg-white/20"></div>
                                     <div className="flex items-center gap-2">
                                        <Icons.Clock className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs font-mono text-green-400">{stats.processingTimeMs}ms</span>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:flex justify-between text-xs text-slate-600 px-2 font-medium">
                    <div className="flex items-center gap-1">
                        <Icons.ArrowRightLeft className="w-3 h-3" />
                        <span>Visual Comparison Mode</span>
                    </div>
                    <div>Canvas 2D Rendering Engine</div>
                </div>
            </section>

            {/* Controls Panel */}
            <aside className="w-full lg:w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-auto lg:h-full overflow-y-auto z-10 shadow-2xl">
                <div className="p-6 space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image Source</h2>
                        <div className="grid grid-cols-1 gap-3">
                            <label className="flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-slate-200 py-3 px-4 rounded-lg cursor-pointer transition-all border border-slate-600 group">
                                <Icons.Upload className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                <span className="text-sm font-medium">Upload Image</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                            <button onClick={handleLoadSample} className="flex items-center justify-center gap-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2 px-4 rounded-lg transition-all border border-slate-700/50 hover:border-slate-600 text-sm">
                                <Icons.FileImage className="w-4 h-4" />
                                <span>Load Sample</span>
                            </button>
                        </div>
                        <div className="pt-2">
                            <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-900/20 font-medium text-sm">
                                <Icons.Download className="w-4 h-4" />
                                <span>Download Result</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Active Filter</span>
                        </h2>
                        <div className="grid grid-cols-1 gap-2">
                            {FILTERS.map((filter) => (
                                <button
                                    key={filter.type}
                                    onClick={() => setActiveFilter(filter.type)}
                                    className={`group relative flex items-center p-3 rounded-xl border transition-all duration-200 text-left ${
                                        activeFilter === filter.type
                                        ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                                        : 'bg-slate-700/20 border-slate-700/50 hover:border-slate-600 hover:bg-slate-700/40'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg mr-3 transition-colors ${
                                        activeFilter === filter.type ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                                    }`}>
                                        {filter.type === FilterType.EDGE_DETECTION ? <Icons.Maximize2 className="w-4 h-4" /> : <Icons.ImageIcon className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-medium text-sm ${activeFilter === filter.type ? 'text-blue-400' : 'text-slate-200'}`}>
                                            {filter.label}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{filter.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </main>
    );
};

const App = () => {
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500/30">
            <Header />
            <ImageProcessor />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);