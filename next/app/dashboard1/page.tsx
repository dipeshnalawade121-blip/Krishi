'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { X, Plus, Edit2, Trash2, Loader2, Upload, Image as ImageIcon } from 'lucide-react';

const BACKEND_URL = 'https://api.krishi.site';
const SUPABASE_URL = 'https://adfxhdbkqbezzliycckx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZnhoZGJrcWJlenpsaXljY2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTIxNjMsImV4cCI6MjA3Njg4ODE2M30.VHyryBwx19-KbBbEDaE-aySr0tn-pCERk9NZXQRzsYU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Product {
  id: string;
  name: string;
  price: string;
  unit: string;
  description?: string;
  image_url?: string;
}

const DashboardPage: React.FC = () => {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id') || localStorage.getItem('user_id') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [shopName, setShopName] = useState<string>('Your Shop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 4000);
  };

  // Fetch profile + products
  const loadDashboard = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/get-user-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setShopName(data.user.shop_name || 'Your Shop');
        setProducts(data.user.products || []);
      }
    } catch (err) {
      console.error(err);
      showStatus('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  // Image upload to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`public/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(`public/${fileName}`);

      return publicUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      showStatus('Image upload failed', 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Save products
  const saveProducts = async (updatedProducts: Product[]) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/save-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, products: updatedProducts }),
      });
      const data = await res.json();

      if (data.success) {
        setProducts(updatedProducts);
        showStatus('Products saved successfully!', 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      showStatus('Failed to save products', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Add/Edit Product
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price) {
      showStatus('Name and price are required', 'error');
      return;
    }

    let imageUrl = editingProduct?.image_url || '';

    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) imageUrl = url;
    }

    const newProduct: Product = {
      id: editingProduct?.id || uuidv4(),
      name: name.trim(),
      price: price.trim(),
      unit,
      description: description.trim(),
      image_url: imageUrl || undefined,
    };

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? newProduct : p);
    } else {
      updatedProducts = [...products, newProduct];
    }

    await saveProducts(updatedProducts);
    closeModal();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setUnit('kg');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setShowAddModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setUnit(product.unit);
    setDescription(product.description || '');
    setImagePreview(product.image_url || '');
    setImageFile(null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview('');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;

    const updated = products.filter(p => p.id !== id);
    await saveProducts(updated);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#0E0E0E] text-white p-4 md:p-8 font-['Inter']">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        `}</style>

        {/* Header */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9ef87a" />
                      <stop offset="100%" stopColor="#009e57" />
                    </linearGradient>
                  </defs>
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">krishi</h1>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-gradient-to-br from-[#9ef87a] to-[#009e57] px-5 py-3 rounded-xl font-semibold hover:scale-105 transition-all shadow-lg"
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>
          <h2 className="text-2xl font-bold mt-2">{shopName} - Dashboard</h2>
          <p className="text-gray-400">Manage your products</p>
        </div>

        {/* Status */}
        {status && (
          <div className={`max-w-6xl mx-auto mb-6 p-4 rounded-xl ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
            {status.text}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#9ef87a]" size={48} />
          </div>
        )}

        {/* Products Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!loading && products.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
              <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <ImageIcon size={48} className="text-gray-500" />
              </div>
              <p className="text-xl">No products yet</p>
              <button onClick={openAddModal} className="mt-4 text-[#9ef87a] underline">Add your first product</button>
            </div>
          )}

          {products.map((product) => (
            <div key={product.id} className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:scale-[1.02] transition-all">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="bg-gray-800/50 h-48 flex items-center justify-center">
                  <ImageIcon size={48} className="text-gray-600" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                {product.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#9ef87a]">₹{product.price}</span>
                    <span className="text-gray-400 ml-1">/{product.unit}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(product)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg transition">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold">{editingProduct ? 'Edit' : 'Add'} Product</h2>
                <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitProduct} className="p-6 space-y-5">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Product Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl" />
                    ) : (
                      <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-xl w-24 h-24 flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-500" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <div className="px-5 py-3 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-xl font-semibold hover:scale-105 transition flex items-center gap-2">
                        <Upload size={18} />
                        {imagePreview ? 'Change' : 'Upload'} Image
                      </div>
                    </label>
                  </div>
                  {uploadingImage && <p className="text-sm text-gray-400 mt-2">Uploading image...</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#9ef87a]/50"
                    placeholder="e.g. Fresh Tomatoes"
                    maxLength={50}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#9ef87a]/50"
                      placeholder="49"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#9ef87a]/50"
                    >
                      <option value="kg">kg</option>
                      <option value="dozen">dozen</option>
                      <option value="piece">piece</option>
                      <option value="liter">liter</option>
                      <option value="bundle">bundle</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#9ef87a]/50 resize-none"
                    placeholder="Fresh organic tomatoes from local farms..."
                    maxLength={200}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    className="flex-1 py-3 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-xl font-semibold hover:scale-105 transition disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {(saving || uploadingImage) ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Saving...
                      </>
                    ) : (
                      editingProduct ? 'Update Product' : 'Add Product'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const DashboardWrapper = () => (
  <Suspense fallback={<div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-white">Loading Dashboard...</div>}>
    <DashboardPage />
  </Suspense>
);

export default DashboardWrapper;
