import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { ServerCapabilities } from '../api/types';
import { Server, CheckCircle2, XCircle } from 'lucide-react';

export default function Setup() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [serverInfo, setServerInfo] = useState<ServerCapabilities | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('komga-base-url');
    if (saved) setUrl(saved);
  }, []);

  const testConnection = async (testUrl: string) => {
    setLoading(true);
    setStatus('idle');
    setErrorMsg('');
    setServerInfo(null);
    try {
      // Strip trailing slash
      const cleanUrl = testUrl.replace(/\/+$/, '');
      const res = await api.get<ServerCapabilities>(`${cleanUrl}/api/v1/server/capabilities`, {
        // Temporarily override baseURL for testing
        baseURL: cleanUrl
      });
      setStatus('success');
      setServerInfo(res.data);
      localStorage.setItem('komga-base-url', cleanUrl);
      // Force update api client base url by triggering interceptor next time
    } catch (err: any) {
      setStatus('error');
      if (err.message === 'Network Error') {
        setErrorMsg('无法连接到服务器。请检查：\n1. 地址和端口是否正确\n2. 后端是否开启并配置了 CORS\n3. 如果是公网 HTTPS，请使用 Chrome 并允许本地网络访问');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || '未知错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto w-full pt-12">
      <div className="flex items-center gap-3 mb-8">
        <Server className="w-8 h-8 text-purple-500" />
        <h1 className="text-2xl font-bold">服务器设置</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <label className="block text-sm font-medium mb-2">局域网后端地址</label>
        <input
          type="url"
          placeholder="http://192.168.x.x:25600"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all mb-4"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={() => testConnection(url)}
          disabled={!url || loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '测试并保存'
          )}
        </button>

        {status === 'success' && serverInfo && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800/30 flex gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">连接成功</p>
              <p className="text-sm opacity-80">
                {serverInfo.name} v{serverInfo.version}
              </p>
              <button 
                onClick={() => navigate('/libraries')}
                className="mt-3 text-sm bg-green-100 dark:bg-green-800/50 px-4 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                前往书库 &rarr;
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/30 flex gap-3">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {errorMsg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
