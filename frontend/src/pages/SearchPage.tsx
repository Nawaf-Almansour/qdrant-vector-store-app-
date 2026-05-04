import { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import ResultGrid from '../components/ResultGrid';
import { Loader2, Search } from 'lucide-react';

interface SearchResultItem {
  image_id: string;
  score: number;
  image_url?: string;
  category?: string;
  business_id?: string;
  filename?: string;
}

export default function SearchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [businessId, setBusinessId] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(10);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!file || !businessId) return;
    setSearching(true);
    setResults([]);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('business_id', businessId);
    if (category) formData.append('category', category);
    formData.append('limit', String(limit));

    try {
      const res = await fetch('/api/v1/images/search', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Search failed');
      }
      const data = await res.json();
      const mapped = (data.results || []).map((r: Record<string, unknown>) => ({
        image_id: r.imageId || r.image_id,
        score: r.score,
        image_url: r.imageUrl || r.image_url,
        category: r.category,
        business_id: r.businessId || r.business_id,
        filename: r.filename,
      }));
      setResults(mapped);
      setSearched(true);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Search Similar Images</h2>
          <p className="text-sm text-gray-500">
            Upload a query image to find visually similar images in the index.
          </p>
        </div>

        <ImageUploader onFileSelect={setFile} label="Drop query image here" />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business ID *
            </label>
            <input
              type="text"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="business_001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="product"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limit
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.min(50, Math.max(1, Number(e.target.value))))}
              min={1}
              max={50}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={!file || !businessId || searching}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {searching ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search size={16} />
              Search
            </>
          )}
        </button>
      </div>

      {searched && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-600 mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </h3>
          <ResultGrid results={results} />
        </div>
      )}
    </div>
  );
}
