import { useState } from 'react';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import { Search, Upload } from 'lucide-react';

type Tab = 'upload' | 'search';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Image Similarity Search
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Powered by Qdrant &amp; CLIP
          </p>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload size={16} />
            Upload &amp; Index
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search size={16} />
            Search Similar
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'upload' ? <UploadPage /> : <SearchPage />}
      </main>
    </div>
  );
}

export default App;
