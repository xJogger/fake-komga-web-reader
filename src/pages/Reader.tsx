import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getImageUrl } from '../api';
import type { Book, PageDto } from '../api/types';
import { ArrowLeft, Settings2, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import clsx from 'clsx';

type ReadMode = 'paged' | 'webtoon';

export default function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<PageDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reader state
  const [readMode, setReadMode] = useState<ReadMode>('paged');
  const [currentPage, setCurrentPage] = useState(1);
  const [showUI, setShowUI] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Load preferences
  useEffect(() => {
    const savedMode = localStorage.getItem('webui.reader.mode') as ReadMode;
    if (savedMode === 'paged' || savedMode === 'webtoon') {
      setReadMode(savedMode);
    }
  }, []);

  const toggleMode = () => {
    const newMode = readMode === 'paged' ? 'webtoon' : 'paged';
    setReadMode(newMode);
    localStorage.setItem('webui.reader.mode', newMode);
    // Ideally we should sync this to client-settings api, but localStorage is fast
  };

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
    
    // Debounce 1.5s
    progressTimerRef.current = window.setTimeout(async () => {
      try {
        await api.patch(`/books/${bookId}/read-progress`, {
          page,
          completed
        });
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

  // Paged mode tap handlers
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (readMode !== 'paged') {
      setShowUI(prev => !prev);
      return;
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const width = window.innerWidth;
    
    // Middle 30% toggles UI
    if (clientX > width * 0.35 && clientX < width * 0.65) {
      setShowUI(prev => !prev);
    } else if (clientX <= width * 0.35) {
      // Left side -> Prev page
      setCurrentPage(p => Math.max(1, p - 1));
    } else {
      // Right side -> Next page
      setCurrentPage(p => Math.max(1, Math.min(pages.length, p + 1)));
    }
  };

  // Webtoon scroll observer
  useEffect(() => {
    if (readMode !== 'webtoon' || pages.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageNum = Number(entry.target.getAttribute('data-page'));
          if (pageNum) {
            setCurrentPage(pageNum);
          }
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

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full bg-black text-slate-200 overflow-hidden select-none">
      
      {/* Top UI */}
      <div 
        className={clsx(
          "absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent pt-safe transition-transform duration-300",
          showUI ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center gap-4 px-4 py-3 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate leading-tight">{book?.metadata.title || book?.name}</h1>
            <p className="text-[10px] text-slate-400 truncate">{book?.seriesTitle}</p>
          </div>
          <button onClick={toggleMode} className="p-2 rounded-full hover:bg-white/10" title="切换阅读模式">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reader Content */}
      <div 
        ref={scrollContainerRef}
        className={clsx(
          "w-full h-full",
          readMode === 'webtoon' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden flex items-center justify-center'
        )}
        onClick={handleTap}
      >
        {readMode === 'paged' ? (
          // Paged Mode
          <img 
            key={currentPage}
            src={getImageUrl(`/books/${bookId}/pages/${currentPage}`)}
            className="w-full h-full object-contain"
            alt={`Page ${currentPage}`}
          />
        ) : (
          // Webtoon Mode
          <div className="flex flex-col w-full max-w-3xl mx-auto">
            {pages.map(page => (
              <img
                key={page.number}
                data-page={page.number}
                src={getImageUrl(`/books/${bookId}/pages/${page.number}`)}
                className="webtoon-page w-full h-auto object-cover"
                loading="lazy"
                alt={`Page ${page.number}`}
              />
            ))}
            <div className="py-20 flex justify-center">
              <span className="text-slate-500">本卷完</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom UI */}
      <div 
        className={clsx(
          "absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/70 to-transparent pb-safe transition-transform duration-300",
          showUI ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevBook} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white p-2">
              <SkipBack className="w-4 h-4" /> 上一卷
            </button>
            <div className="text-sm font-mono text-slate-300">
              {currentPage} / {pages.length}
            </div>
            <button onClick={handleNextBook} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white p-2">
              下一卷 <SkipForward className="w-4 h-4" />
            </button>
          </div>
          
          {readMode === 'paged' && (
            <input 
              type="range" 
              min="1" 
              max={pages.length} 
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          )}
        </div>
      </div>
      
    </div>
  );
}
