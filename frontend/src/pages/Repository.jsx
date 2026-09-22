import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, UploadCloud, Database, Presentation, FileCode2, Filter, X } from 'lucide-react';
import api from '../services/api';

const Repository = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    asset_type: 'OTHER',
    file: null
  });

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.title || !uploadData.file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('asset_type', uploadData.asset_type);
      formData.append('file', uploadData.file);

      await api.post('/faculty/repository/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsUploadModalOpen(false);
      setUploadData({ title: '', description: '', asset_type: 'OTHER', file: null });
      fetchAssets();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload asset");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/faculty/repository/');
      setAssets(res.results || res);
    } catch (error) {
      console.error("Error fetching repository assets", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'DATASET': return <Database className="text-blue-500" />;
      case 'CODE': return <FileCode2 className="text-green-500" />;
      case 'PREPRINT': return <FileText className="text-indigo-500" />;
      case 'PRESENTATION': return <Presentation className="text-orange-500" />;
      default: return <FileText className="text-gray-500" />;
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || asset.asset_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Institutional Repository</h1>
          <p className="text-gray-500">Discover and share research assets across the institution.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <UploadCloud size={18} />
          <span>Upload Asset</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search datasets, code, pre-prints..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={20} />
          <select 
            className="bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="DATASET">Datasets</option>
            <option value="CODE">Source Code</option>
            <option value="PREPRINT">Pre-prints</option>
            <option value="PRESENTATION">Presentations</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Database className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No assets found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  {getIcon(asset.asset_type)}
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {asset.asset_type.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{asset.title}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-grow">{asset.description}</p>
              
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                <div className="text-sm text-gray-500">
                  <span className="block font-medium text-gray-700">{asset.uploaded_by_name}</span>
                  <span className="text-xs">{new Date(asset.created_at).toLocaleDateString()}</span>
                </div>
                <a 
                  href={asset.file} 
                  download 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={20} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
            <button 
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Research Asset</h2>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  required
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Asset title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows="3"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Brief description..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                <select 
                  value={uploadData.asset_type}
                  onChange={(e) => setUploadData({...uploadData, asset_type: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="DATASET">Dataset</option>
                  <option value="CODE">Source Code</option>
                  <option value="PREPRINT">Pre-print Paper</option>
                  <option value="PRESENTATION">Presentation/Slides</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input 
                  type="file" 
                  required
                  onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm
                    file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                    file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isUploading ? 'Uploading...' : 'Upload Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repository;
