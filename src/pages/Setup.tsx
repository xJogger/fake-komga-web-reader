import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { ServerCapabilities } from '../api/types';
import { Settings, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

export default function Setup() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [serverInfo, setServerInfo] = useState<ServerCapabilities | null>(null);
  
  const [defaultSort, setDefaultSort] = useState('metadata.titleSort,asc');
  
  const navigate = useNavigate();

  useEffect(() => {
    const savedUrl = localStorage.getItem('komga-base-url');
    if (savedUrl) setUrl(savedUrl);
    
    const savedSort = localStorage.getItem('webui.defaultSort');
    if (savedSort) setDefaultSort(savedSort);
  }, []);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setDefaultSort(newSort);
    localStorage.setItem('webui.defaultSort', newSort);
  };

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
    } catch (err: any) {
      setStatus('error');
      if (err.message === 'Network Error') {
        const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
        if (isFirefox) {
          setErrorMsg('连接失败 (火狐浏览器拦截)。\n\n【强烈建议】：\n由于安全限制，火狐默认无法连接局域网 HTTP，请使用 Chrome 或 Edge 浏览器。\n\n【硬核后门 (风险自负)】：\n在火狐地址栏输入 about:config，将 security.mixed_content.block_active_content 设为 false。\n(警告：这会导致火狐对所有网站失去混合内容保护，极大降低安全性！)');
        } else {
          setErrorMsg('无法连接到服务器。请检查：\n1. 地址和端口是否正确\n2. 后端是否配置了 CORS\n3. 如果是 Safari 可能会拦截 HTTP 混合内容\n4. Chrome 请允许“本地网络访问”');
        }
      } else {
        setErrorMsg(err.response?.data?.message || err.message || '未知错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto w-full pt-12 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-purple-500" />
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      {/* 服务器配置区块 */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">服务器连接</h2>
        <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">局域网后端地址</label>
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

      {/* 阅读与显示偏好区块 */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">阅读与显示偏好</h2>
        
        <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">默认书库排序方式</label>
        <select 
          value={defaultSort} 
          onChange={handleSortChange}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
        >
          <option value="metadata.titleSort,asc">名称正序</option>
          <option value="metadata.titleSort,desc">名称倒序</option>
          <option value="lastModifiedDate,desc">最近修改</option>
          <option value="createdDate,desc">最近添加</option>
          <option value="random">随机</option>
        </select>
      </div>

      {/* 关于区块 */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">关于项目</h2>
        
        <a 
          href="https://github.com/xJogger/fake-komga-web-reader" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors mb-2 text-slate-700 dark:text-slate-300"
        >
          <ExternalLink className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium text-sm">前端开源仓库</div>
            <div className="text-xs opacity-60">fake-komga-web-reader</div>
          </div>
        </a>

        <a 
          href="https://github.com/xJogger/fake-komga-115" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-300"
        >
          <ExternalLink className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium text-sm">后端开源仓库</div>
            <div className="text-xs opacity-60">fake-komga-115</div>
          </div>
        </a>
      </div>
    </div>
  );
}
