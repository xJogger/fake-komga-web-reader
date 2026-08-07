import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Book, PageResponse, Series } from '../api/types';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';

export default function BookList() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const [seriesRes, booksRes] = await Promise.all([
          api.get<Series>(`/series/${seriesId}`),
          api.get<PageResponse>(`/series/${seriesId}/books?unpaged=true&sort=metadata.numberSort,asc`)
        ]);
        setSeries(seriesRes.data);
        setBooks(booksRes.data.content);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (seriesId) fetchBooks();
  }, [seriesId]);

  return (
    <div className="w-full pb-8">
      <div className="sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-10 px-4 py-3 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex-1 truncate">{series?.metadata.title || '载入中...'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3">
          {books.map(book => (
            <Link
              key={book.id}
              to={`/reader/${book.id}`}
              className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors active:scale-[0.99]"
            >
              <div className="w-16 h-24 shrink-0 rounded overflow-hidden bg-slate-200 dark:bg-slate-800">
                {/* Book cover might be the same as series cover or a specific book thumbnail if supported. Komga API supports /books/{id}/thumbnail */}
                <img 
                  src={`${api.defaults.baseURL}/books/${book.id}/thumbnail`}
                  alt={book.metadata.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to series thumbnail
                    (e.target as HTMLImageElement).src = `${api.defaults.baseURL}/series/${seriesId}/thumbnail`;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {book.metadata.title || `第 ${book.number} 卷`}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {book.media.pagesCount > 0 ? `${book.media.pagesCount} 页` : '未解析页数'}
                </p>
                {book.readProgress && (
                  <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full" 
                      style={{ 
                        width: book.readProgress.completed ? '100%' : `${Math.min(100, (book.readProgress.page / Math.max(1, book.media.pagesCount)) * 100)}%` 
                      }} 
                    />
                  </div>
                )}
              </div>
              <div className="text-purple-500 pr-2">
                <BookOpen className="w-5 h-5 opacity-50" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
