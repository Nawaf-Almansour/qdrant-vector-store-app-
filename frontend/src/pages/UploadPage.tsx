import { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

type Status = 'idle' | 'uploading' | 'success' | 'error';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [businessId, setBusinessId] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<{ imageId: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!file || !businessId) return;
    setStatus('uploading');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('business_id', businessId);
    if (category) formData.append('category', category);

    try {
      const res = await fetch('/api/v1/images/index', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }
      const data = await res.json();
      setResult({ imageId: data.image_id || data.imageId });
      setStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Upload &amp; Index Image</h2>
        <p className="text-sm text-gray-500">
          Upload an image to generate its CLIP embedding and store it in Qdrant.
        </p>
      </div>

      <ImageUploader onFileSelect={setFile} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business ID *
          </label>
          <input
            type="text"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            placeholder="e.g. business_001"
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
            placeholder="e.g. product"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || !businessId || status === 'uploading'}
        className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {status === 'uploading' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Indexing...
          </>
        ) : (
          'Upload & Index'
        )}
      </button>

      {status === 'success' && result && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle size={16} />
          Image indexed successfully. ID: <code className="font-mono text-xs">{result.imageId}</code>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
