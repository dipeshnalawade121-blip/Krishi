'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { X, Plus, Edit2, Trash2, Loader2, Upload, Image as ImageIcon } from 'lucide-react';

const BACKEND_URL = 'https://api.krishi.site';

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
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 4000);
  };

  const loadDashboard = async () => {
    if (!userId) return setLoading(false);

    try {
      const res = await fetch(`${BACKEND_URL}/get-user-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      const data = await res.json();

      if (data.success) {
        setShopName(data.user.shop_name || 'Your Shop');
        setProducts(data.user.products || []);
      }
    } catch (err) {
      showStatus('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, [userId]);

  // Upload image via backend
  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('id', userId);

    try {
      const res = await fetch(`${BACKEND_URL}/upload-product-image`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) return data.image_url;
      else throw new Error(data.error);
    } catch (err: any) {
      showStatus(err.message || 'Image upload failed', 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveProducts = async (updated: Product[]) => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/save-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, products: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(updated);
        showStatus('Products saved!', 'success');
      } else throw new Error(data.error);
    } catch (err: any) {
      showStatus(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return showStatus('Name & price required', 'error');

    let imageUrl = editingProduct?.image_url || '';
    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) imageUrl = url;
    }

    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: name.trim(),
      price: price.trim(),
      unit,
      description: description.trim() || undefined,
      image_url: imageUrl || undefined,
    };

    const updated = editingProduct
      ? products.map(p => p.id === editingProduct.id ? product : p)
      : [...products, product];

    await saveProducts(updated);
    closeModal();
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price);
    setUnit(p.unit);
    setDescription(p.description || '');
    setImagePreview(p.image_url || '');
    setImageFile(null);
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName(''); setPrice(''); setUnit('kg'); setDescription(''); setImageFile(null); setImagePreview('');
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
    await saveProducts(products.filter(p => p.id !== id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#0E0E0E] text-white p-6 font-['Inter']">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#g)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <defs><linearGradient id="g"><stop offset="0%" stopColor="#9ef87a" /><stop offset="100%" stopColor="# c057"/></linearGradient></defs>
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
                <h1 className="text-4xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">krishi</h1>
              </div>
              <h2 className="text-2xl font-bold">{shopName} - Dashboard</h2>
            </div>
            <button onClick={openAddModal} className="flex items-center gap-2 bg-gradient-to-br from-[#9ef87a] to-[#009e57] px-6 py-3 rounded-xl font-bold hover:scale-105 transition shadow-lg">
              <Plus size={22} /> Add Product
            </button>
          </div>

          {status && (
            <div className={`p-4 rounded-xl mb-6 ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
              {status.text}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#9ef87a]" size={50} /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <ImageIcon size={50} className="text-gray-500" />
              </div>
              <p className="text-xl mb-4">No products yet</p>
              <button onClick={openAddModal} className="text-[#9ef87a] underline text-lg">Add your first product →</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-2xl border border-white/10 overflow-hidden hover:scale-[1.02] transition">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-48 object-cover" /> : (
                    <div className="h-48 bg-gray-800/50 flex items-center justify-center"><ImageIcon size={50} className="text-gray-600" /></div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                    {p.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{p.description}</p>}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-[#9ef87a]">₹{p.price}<span className="text-sm text-gray-400">/{p.unit}</span></span>
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(p)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg"><Edit2 size={18} /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold">{editingProduct ? 'Edit' : 'Add'} Product</h2>
                <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Product Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? <img src={imagePreview} alt="prev" className="w-24 h-24 object-cover rounded-xl" /> : (
                      <div className="w-24 h-24 bg-gray-800/50 border-2 border-dashed rounded-xl flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-500" />
                      </div>
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-xl font-semibold flex items-center gap-2">
                      <Upload size={18} /> {imagePreview ? 'Change' : 'Upload'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </div>
                  {uploading && <p className="text-sm text-gray-400 mt-2">Uploading image...</p>}
                </div>

                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" maxLength={50}
                  className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 focus:border-[#9ef87a]/50 outline-none" />

                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price ₹"
                    className="bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 focus:border-[#9ef87a]/50 outline-none" />
                  <select value={unit} onChange={e => setUnit(e.target.value)}
                    className="bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 focus:border-[#9ef87a]/50 outline-none">
                    <option value="kg">kg</option>
                    <option value="dozen">dozen</option>
                    <option value="piece">piece</option>
                    <option value="liter">liter</option>
                    <option value="bundle">bundle</option>
                  </select>
                </div>

                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Description (optional)" maxLength={200}
                  className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-4 py-3 resize-none focus:border-[#9ef87a]/50 outline-none" />

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold">Cancel</button>
                  <button type="submit" disabled={saving || uploading}
                    className="flex-1 py-3 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-xl font-semibold hover:scale-105 transition disabled:opacity-70 flex items-center justify-center gap-2">
                    {(saving || uploading) ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : (editingProduct ? 'Update' : 'Add') + ' Product'}
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

const DashboardWrapper = () => <Suspense fallback={<div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-white text-xl">Loading Dashboard...</div>}><DashboardPage /></Suspense>;
export default DashboardWrapper;
