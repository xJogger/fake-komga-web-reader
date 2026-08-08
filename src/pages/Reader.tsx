import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { api, getImageUrl, safeStorage } from '../api';
import type { Book, PageDto } from '../api/types';
import { ArrowLeft, Settings2, SkipBack, SkipForward, Loader2, X } from 'lucide-react';
import clsx from 'clsx';

type ReadMode = 'paged' | 'webtoon' | 'double';
type ReadDirection = 'ltr' | 'rtl';
type ScaleMode = 'fit-screen' | 'fit-width' | 'custom';

// Lazy loaded image component for Webtoon mode
const LazyImage = ({ page, bookId, customWidth }: { page: PageDto, bookId: string, customWidth: number }) => {
  const { ref, inView } = useInView({
    rootMargin: '1200px 0px', // Load images up to 1200px (about 1.5 screens) ahead/behind
    triggerOnce: true
  });

  return (
    <div ref={ref} data-page={page.number} className="webtoon-page w-full flex items-center justify-center bg-transparent my-0">
      {inView ? (
        <img
          src={getImageUrl(`/books/${bookId}/pages/${page.number}`)}
          className="h-auto object-contain"
          style={{ width: `${customWidth}%` }}
          loading="lazy"
          alt={`Page ${page.number}`}
        />
      ) : (
        <div className="text-slate-500 text-sm min-h-[300px] flex items-center">加载中...</div>
      )}
    </div>
  );
};

export default function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<PageDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reader state
  const [readMode, setReadMode] = useState<ReadMode>(() => (safeStorage.get('webui.reader.mode') as ReadMode) || 'paged');
  const [direction, setDirection] = useState<ReadDirection>(() => (safeStorage.get('webui.reader.direction') as ReadDirection) || 'ltr');
  const [scaleMode, setScaleMode] = useState<ScaleMode>(() => (safeStorage.get('webui.reader.scale') as ScaleMode) || 'fit-screen');
  const [customWidth, setCustomWidth] = useState<number>(() => Number(safeStorage.get('webui.reader.customWidth')) || 100);
  const [firstPageSolo, setFirstPageSolo] = useState<boolean>(() => safeStorage.get('webui.reader.firstPageSolo') !== 'false');

  const [currentPage, setCurrentPage] = useState(1);
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Settings Save Helpers
  const updateMode = (v: ReadMode) => { setReadMode(v); safeStorage.set('webui.reader.mode', v); };
  const updateDirection = (v: ReadDirection) => { setDirection(v); safeStorage.set('webui.reader.direction', v); };
  const updateScale = (v: ScaleMode) => { setScaleMode(v); safeStorage.set('webui.reader.scale', v); };
  const updateCustomWidth = (v: number) => { setCustomWidth(v); safeStorage.set('webui.reader.customWidth', v.toString()); };
  const updateFirstPageSolo = (v: boolean) => { setFirstPageSolo(v); safeStorage.set('webui.reader.firstPageSolo', v.toString()); };

  useEffect(() => {
    const fetchBookAndPages = async () => {
      try {
        setLoading(true);
        const [bookRes, pagesRes] = await Promise.all([
          api.get<Book>(`/books/${bookId}`),
          api.get<PageDto[]>(`/books/${bookId}/pages`)
        ]);
        setBook(bookRes.data);
        setPages(pagesRes.data);
        
        if (bookRes.data.readProgress) {
          setCurrentPage(bookRes.data.readProgress.page);
        } else {
          setCurrentPage(1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (bookId) fetchBookAndPages();
  }, [bookId]);

  // Sync progress to backend
  const syncProgress = useCallback((page: number, completed = false) => {
    if (!bookId) return;
    if (progressTimerRef.current) window.clearTimeout(progressTimerRef.current);
    
    progressTimerRef.current = window.setTimeout(async () => {
      try {
        await api.patch(`/books/${bookId}/read-progress`, { page, completed });
      } catch (err) {
        console.error('Failed to sync progress', err);
      }
    }, 1500);
  }, [bookId]);

  // Handle page change
  useEffect(() => {
    if (!loading && pages.length > 0) {
      const isCompleted = currentPage >= pages.length;
      syncProgress(currentPage, isCompleted);
    }
  }, [currentPage, loading, pages.length, syncProgress]);

  // Page Navigation logic
  const goPrev = useCallback(() => {
    setCurrentPage(p => {
      if (readMode === 'double') {
        if (firstPageSolo && p === 2) return 1;
        if (firstPageSolo && p === 3) return 1;
        return Math.max(1, p - 2);
      }
      return Math.max(1, p - 1);
    });
  }, [readMode, firstPageSolo]);

  const goNext = useCallback(() => {
    setCurrentPage(p => {
      if (readMode === 'double') {
        if (firstPageSolo && p === 1) return 2;
        return Math.min(pages.length, p + 2);
      }
      return Math.min(pages.length, p + 1);
    });
  }, [readMode, firstPageSolo, pages.length]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings) {
        if (e.key === 'Escape') setShowSettings(false);
        return;
      }
      
      if (e.key === 'Escape') {
        setShowUI(prev => !prev);
        return;
      }

      if (readMode === 'webtoon') return; // Let browser scroll

      if (e.key === 'ArrowLeft') {
        direction === 'ltr' ? goPrev() : goNext();
      } else if (e.key === 'ArrowRight') {
        direction === 'ltr' ? goNext() : goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, readMode, direction, goPrev, goNext]);

  // Mouse / Tap Handlers
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (showSettings) return;
    if (readMode === 'webtoon') {
      setShowUI(prev => !prev);
      return;
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const width = window.innerWidth;
    
    if (clientX > width * 0.35 && clientX < width * 0.65) {
      setShowUI(prev => !prev);
    } else if (clientX <= width * 0.35) {
      // Tap Left
      direction === 'ltr' ? goPrev() : goNext();
    } else {
      // Tap Right
      direction === 'ltr' ? goNext() : goPrev();
    }
  };

  // Webtoon scroll observer
  useEffect(() => {
    if (readMode !== 'webtoon' || pages.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageNum = Number(entry.target.getAttribute('data-page'));
          if (pageNum) setCurrentPage(pageNum);
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    
    const pageEls = document.querySelectorAll('.webtoon-page');
    pageEls.forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, [readMode, pages]);

  const handlePrevBook = async () => {
    try {
      const res = await api.get<Book>(`/books/${bookId}/previous`);
      navigate(`/reader/${res.data.id}`, { replace: true });
    } catch {
      alert('已经是第一卷');
    }
  };

  const handleNextBook = async () => {
    try {
      const res = await api.get<Book>(`/books/${bookId}/next`);
      navigate(`/reader/${res.data.id}`, { replace: true });
    } catch {
      alert('已经是最后一卷');
    }
  };

  // Render Helpers
  const getImageClass = () => {
    if (scaleMode === 'fit-screen') return 'object-contain w-full h-full';
    if (scaleMode === 'fit-width') return 'w-full h-auto block';
    return 'h-auto block'; // custom
  };

  const getImageStyle = () => {
    if (scaleMode === 'custom') {
      return { width: `${customWidth}%` };
    }
    return {};
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-slate-500" />
      </div>
    );
  }

  // Calculate pages to show for Paged and Double modes
  let visiblePages: number[] = [];
  if (readMode === 'paged') {
    visiblePages = [currentPage];
  } else if (readMode === 'double') {
    if (firstPageSolo && currentPage === 1) {
      visiblePages = [1];
    } else {
      // Normalize to left page index
      const base = firstPageSolo ? (currentPage % 2 === 0 ? currentPage : currentPage - 1) : (currentPage % 2 !== 0 ? currentPage : currentPage - 1);
      visiblePages = [base];
      if (base + 1 <= pages.length) {
        visiblePages.push(base + 1);
      }
      if (direction === 'rtl') {
        visiblePages.reverse();
      }
    }
  }

  return (
    <div className="relative h-[100dvh] w-full bg-[#0a0a0a] text-slate-200 overflow-hidden select-none">
      
      {/* Top UI */}
      <div 
        className={clsx(
          "absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 to-transparent pt-safe transition-transform duration-300",
          showUI ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center gap-4 px-4 py-3 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate leading-tight">{book?.metadata.title || book?.name}</h1>
            <p className="text-[10px] text-slate-400 truncate">{book?.seriesTitle}</p>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer" title="阅读设置">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reader Content */}
      <div 
        ref={scrollContainerRef}
        className={clsx(
          "w-full h-full",
          readMode === 'webtoon' ? 'overflow-y-auto overflow-x-hidden' : 
            (scaleMode === 'fit-width' || scaleMode === 'custom') ? 'overflow-auto flex flex-col items-center justify-start' : 
            'overflow-hidden flex items-center justify-center'
        )}
        onClick={handleTap}
      >
        {readMode === 'webtoon' ? (
          // Webtoon Mode
          <div className="flex flex-col w-full mx-auto" style={scaleMode === 'custom' ? { alignItems: 'center' } : {}}>
            {pages.map(page => (
              <LazyImage key={page.number} page={page} bookId={bookId!} customWidth={scaleMode === 'custom' ? customWidth : 100} />
            ))}
            <div className="py-20 flex justify-center">
              <span className="text-slate-500">本卷完</span>
            </div>
          </div>
        ) : (
          // Paged & Double Mode
          <div className="flex w-full h-full justify-center max-w-full">
            {visiblePages.map(pageNum => (
              <img 
                key={pageNum}
                src={getImageUrl(`/books/${bookId}/pages/${pageNum}`)}
                className={clsx(getImageClass(), readMode === 'double' && visiblePages.length === 2 ? 'h-full w-auto object-contain' : '')}
                style={readMode === 'double' && visiblePages.length === 2 ? {} : getImageStyle()}
                alt={`Page ${pageNum}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom UI */}
      <div 
        className={clsx(
          "absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/95 via-black/80 to-transparent pb-safe transition-transform duration-300",
          showUI ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="px-6 py-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevBook} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white p-2 cursor-pointer transition-colors">
              <SkipBack className="w-4 h-4" /> 上一卷
            </button>
            <div className="text-sm font-mono text-slate-300">
              {currentPage} / {pages.length}
            </div>
            <button onClick={handleNextBook} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white p-2 cursor-pointer transition-colors">
              下一卷 <SkipForward className="w-4 h-4" />
            </button>
          </div>
          
          {readMode !== 'webtoon' && (
            <input 
              type="range" 
              min="1" 
              max={pages.length} 
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className={clsx("w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500", direction === 'rtl' ? 'rotate-180' : '')}
            />
          )}
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="font-semibold text-lg">阅读器设置</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Mode */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">排版模式</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => updateMode('paged')} className={clsx("py-2 rounded-lg text-sm border cursor-pointer transition-colors", readMode === 'paged' ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 hover:bg-slate-800")}>单页</button>
                  <button onClick={() => updateMode('double')} className={clsx("py-2 rounded-lg text-sm border cursor-pointer transition-colors", readMode === 'double' ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 hover:bg-slate-800")}>双页</button>
                  <button onClick={() => updateMode('webtoon')} className={clsx("py-2 rounded-lg text-sm border cursor-pointer transition-colors", readMode === 'webtoon' ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 hover:bg-slate-800")}>连续</button>
                </div>
              </div>

              {/* Direction (Hidden for Webtoon) */}
              {readMode !== 'webtoon' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">翻页方向</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateDirection('ltr')} className={clsx("py-2 rounded-lg text-sm border cursor-pointer transition-colors", direction === 'ltr' ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 hover:bg-slate-800")}>从左到右 (LTR)</button>
                    <button onClick={() => updateDirection('rtl')} className={clsx("py-2 rounded-lg text-sm border cursor-pointer transition-colors", direction === 'rtl' ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 hover:bg-slate-800")}>从右到左 (RTL)</button>
                  </div>
                </div>
              )}

              {/* Scale */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">页面缩放</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => updateScale('fit-screen')} className={clsx("py-2 rounded-lg text-sm border cursor-pointer transition-colors", scaleMode === 'fit-screen' ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 hover:bg-slate-800")}>适应屏幕</button>
                  <button onClick={() => updateScale('fit-width')} className={clsx("py-2 rounded-lg text-sm border cursor-pointer transition-colors", scaleMode === 'fit-width' ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 hover:bg-slate-800")}>适应宽度</button>
                  <button onClick={() => updateScale('custom')} className={clsx("py-2 rounded-lg text-sm border cursor-pointer transition-colors", scaleMode === 'custom' ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 hover:bg-slate-800")}>自定义</button>
                </div>
              </div>

              {/* Custom Width Slider */}
              {scaleMode === 'custom' && (
                <div>
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <label>自定义宽度</label>
                    <span>{customWidth}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="300" 
                    step="5"
                    value={customWidth}
                    onChange={(e) => updateCustomWidth(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              )}

              {/* Double Page Options */}
              {readMode === 'double' && (
                <div>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">封面 (第一页) 单独居中显示</span>
                    <div className={clsx("w-10 h-6 rounded-full p-1 transition-colors relative", firstPageSolo ? "bg-purple-500" : "bg-slate-700")}>
                      <div className={clsx("w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200", firstPageSolo ? "translate-x-4" : "translate-x-0")} />
                    </div>
                    {/* Hidden input just to satisfy a11y partially, click handled on label via standard HTML checkbox behavior, but we use onClick on label */}
                    <input type="checkbox" className="hidden" checked={firstPageSolo} onChange={(e) => updateFirstPageSolo(e.target.checked)} />
                  </label>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
