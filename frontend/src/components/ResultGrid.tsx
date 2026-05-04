interface SearchResult {
  image_id: string;
  score: number;
  image_url?: string;
  category?: string;
  business_id?: string;
  filename?: string;
}

interface ResultGridProps {
  results: SearchResult[];
}

export default function ResultGrid({ results }: ResultGridProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No results yet. Upload a query image to search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {results.map((result) => (
        <div
          key={result.image_id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="aspect-square bg-gray-100">
            {result.image_url ? (
              <img
                src={result.image_url}
                alt={result.filename || result.image_id}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                No preview
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {(result.score * 100).toFixed(1)}% match
              </span>
              {result.category && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {result.category}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate mt-1">
              {result.filename || result.image_id}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
