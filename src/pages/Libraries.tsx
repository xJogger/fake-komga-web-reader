import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Library } from '../api/types';
import { Library as LibraryIcon, Loader2, AlertCircle } from 'lucide-react';

export default function Libraries() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const res = await api.get<Library[]>('/libraries');
        setLibraries(res.data);
      } catch (err: any) {
        setError(err.message || '加载书库失败');
      } finally {
        setLoading(false);
      }
    };
    fetchLibraries();
  }, []);

  return (
    <div className="p-4 w-full pt-6">
      <div className="flex items-center gap-3 mb-6 px-2">
        <LibraryIcon className="w-7 h-7 text-purple-500" />
        <h1 className="text-2xl font-bold tracking-tight">我的书库</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl mx-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && libraries.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p>没有找到书库</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2 pb-6">
        {libraries.map(lib => (
          <Link
            key={lib.id}
            to={`/libraries/${lib.id}`}
            className="group flex flex-col p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                <LibraryIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                {lib.name}
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-auto ml-13">
              {lib.oneshotsDirectory === '.' ? '短篇模式' : '标准模式'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
