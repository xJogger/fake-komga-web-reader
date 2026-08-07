import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getImageUrl, safeStorage } from '../api';
import type { PageResponse, Series } from '../api/types';
import { ArrowLeft, Loader2, Search } from 'lucide-react';

export default function SeriesList() {
  const { libraryId } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState(() => safeStorage.get('webui.defaultSort') || 'metadata.titleSort,asc');

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const res = await api.get<PageResponse>(
          `/series?library_id=${libraryId}&page=${page}&size=20&sort=${sort}`
        );
        if (page === 0) {
          setSeries(res.data.content);
        } else {
          setSeries(prev => [...prev, ...res.data.content]);
        }
        setHasMore(!res.data.last);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (libraryId) fetchSeries();
  }, [libraryId, page, sort]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value);
    setPage(0);
    setSeries([]);
  };

  return (
    <div className="p-4 w-full">
      <div className="sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-10 -mx-4 px-4 py-3 flex items-center gap-3 border-b border-transparent mb-4">
        <button 
          onClick={() => navigate('/libraries')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex-1 truncate">系列列表</h1>
        <select 
          value={sort} 
          onChange={handleSortChange}
          className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="metadata.titleSort,asc">名称正序</option>
          <option value="metadata.titleSort,desc">名称倒序</option>
          <option value="lastModifiedDate,desc">最近修改</option>
          <option value="createdDate,desc">最近添加</option>
          <option value="random">随机</option>
        </select>
        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
          <Search className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-8">
        {series.map(item => (
          <Link
            key={item.id}
            to={`/series/${item.id}`}
            className="group flex flex-col"
          >
            <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 relative shadow-sm group-hover:shadow-md transition-all">
              <img 
                src={getImageUrl(`/series/${item.id}/thumbnail`)}
                alt={item.metadata.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {item.booksUnreadCount > 0 && (
                <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  {item.booksUnreadCount}
                </div>
              )}
            </div>
            <h2 className="mt-2 text-sm font-medium leading-snug line-clamp-2 text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {item.metadata.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{item.booksCount} 卷</p>
          </Link>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-6 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {hasMore && !loading && (
        <button 
          onClick={() => setPage(p => p + 1)}
          className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors mb-6"
        >
          加载更多
        </button>
      )}
    </div>
  );
}
