'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { 
  X, Plus, Edit2, Trash2, Loader2, Upload, Image as ImageIcon,
  Package, Image, Layout, Settings, User, Store, HelpCircle, LogOut, ArrowLeft
} from 'lucide-react';

const BACKEND_URL = 'https://api.krishi.site';

interface Product {
  id: string;
  name: string;
  price: string;
  unit: string;
  description?: string;
  image_url?: string;
}

type ActiveSection = 'home' | 'products' | 'banners' | 'templates' | 'settings' | 'profile' | 'shop' | 'support';

const DashboardPage: React.FC = () => {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id') || localStorage.getItem('user_id') || '';
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');

  // Shared data
  const [shopName, setShopName] = useState<string>('Your Shop');
  const [products, setProducts] = useState<Product[]>([]);

  // Products states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  // Load profile + products
  const loadData = async () => {
    if (!userId) return;
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
      showStatus('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // Image upload
  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('id', userId);

    try {
      const res = await fetch(`${BACKEND_URL}/upload-product-image`, { method: 'POST', body: formData });
      const data = await res.json();
      return data.success ? data.image_url : null;
    } catch (err: any) {
      showStatus(err.message || 'Upload failed', 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Save products
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
        showStatus('Saved!', 'success');
      }
    } catch (err) {
      showStatus('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Product handlers
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return showStatus('Required fields missing', 'error');

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
    setShowAddModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview('');
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name); setPrice(p.price); setUnit(p.unit); setDescription(p.description || ''); setImagePreview(p.image_url || '');
    setShowAddModal(true);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Delete permanently?')) {
      saveProducts(products.filter(p => p.id !== id));
    }
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

  const closeSection = () => setActiveSection('home');

  // Menu items
  const menu = [
    { title: 'Products', icon: Package, section: 'products' as ActiveSection },
    { title: 'Banners', icon: Image, section: 'banners' as ActiveSection },
    { title: 'Templates', icon: Layout, section: 'templates' as ActiveSection },
    { title: 'Settings', icon: Settings, section: 'settings' as ActiveSection },
    { title: 'User Profile', icon: User, section: 'profile' as ActiveSection },
    { title: 'Shop Profile', icon: Store, section: 'shop' as ActiveSection },
    { title: 'Help/Support', icon: HelpCircle, section: 'support' as ActiveSection },
    { title: 'Logout', icon: LogOut, section: 'home' as ActiveSection, special: true },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#0E0E0E] text-white font-['Inter'] overflow-hidden">

        {/* HOME SCREEN */}
        {activeSection === 'home' && (
          <div className="p-8 md:p-12">
            <div className="max-w-6xl mx-auto">
              <div className="text-center md:text-left mb-12">
                <div className="flex justify-center md:justify-start items-center gap-4 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#g)" strokeWidth="2.5">
                    <defs><linearGradient id="g"><stop offset="0%" stopColor="#9ef87a" /><stop offset="100%" stopColor="#009e57" /></linearGradient></defs>
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                  <h1 className="text-6xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">krishi</h1>
                </div>
                <h2 className="text-4xl font-bold mt-4">{shopName}</h2>
                <p className="text-gray-400 text-lg mt-2">Manage your shop</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {menu.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => !item.special && setActiveSection(item.section)}
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-10 text-left hover:scale-105 transition-all duration-300 shadow-2xl"
                  >
                    <item.icon size={56} className="mb-4 text-gray-400 group-hover:text-[#9ef87a] transition" />
                    <h3 className="text-2xl font-bold">{item.title}</h3>
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition">
                      <span className="text-sm font-medium text-[#9ef87a]">Open →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS SECTION (Full Screen Modal Style) */}
        {activeSection === 'products' && (
          <div className="fixed inset-0 bg-[#0E0E0E] overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-b from-[#101114] to-[#0E0E0E] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={closeSection} className="lg:hidden">
                      <ArrowLeft size={32} />
                    </button>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">Products</h1>
                      <p className="text-gray-400">{shopName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-br from-[#9ef87a] to-[#009e57] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition">
                    <Plus size={24} /> Add Product
                  </button>
                </div>
              </div>

              <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                {status && <div className={`p-4 rounded-xl mb-6 text-center ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>{status.text}</div>}

                {loading ? (
                  <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#9ef87a]" size={60} /></div>
                ) : products.length === 0 ? (
                  <div className="text-center py-32">
                    <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-3xl w-40 h-40 mx-auto mb-8 flex items-center justify-center">
                      <ImageIcon size={80} className="text-gray-500" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">No products yet</h3>
                    <button onClick={() => setShowAddModal(true)} className="text-[#9ef87a] text-xl underline">Add your first product →</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map(p => (
                      <div key={p.id} className="group bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 overflow-hidden shadow-2xl hover:scale-105 transition-all">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-64 object-cover" /> : 
                          <div className="h-64 bg-gray-800/50 flex items-center justify-center"><ImageIcon size={70} className="text-gray-600" /></div>}
                        <div className="p-6">
                          <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                          {p.description && <p className="text-gray-400 text-sm mb-4 line-clamp-2">{p.description}</p>}
                          <div className="flex justify-between items-end">
                            <span className="text-3xl font-black text-[#9ef87a]">₹{p.price}<span className="text-lg text-gray-400">/{p.unit}</span></span>
                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => openEdit(p)} className="p-3 bg-blue-500/20 hover:bg-blue-500/40 rounded-xl"><Edit2 size={22} /></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-xl"><Trash2 size={22} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add/Edit Modal (inside products) */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-8 border-b border-white/10">
                    <h2 className="text-3xl font-bold">{editingProduct ? 'Editaa Edit' : 'Add'} Product</h2>
                    <button onClick={() => { setShowAddModal(false); setEditingProduct(null); setImageFile(null); setImagePreview(''); }} className="p-3 hover:bg-white/10 rounded-xl"><X size={32} /></button>
                  </div>
                  <form onSubmit={handleProductSubmit} className="p-8 space-y-8">
                    {/* Image upload same as before */}
                    <div className="flex items-center gap-6">
                      {imagePreview ? <img src={imagePreview} alt="prev" className="w-32 h-32 object-cover rounded-2xl" /> : 
                        <div className="w-32 h-32 bg-gray-800/50 border-2 border-dashed rounded-2xl flex items-center justify-center"><ImageIcon size={48} className="text-gray-500" /></div>}
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition">
                        <Upload size={28} /> {imagePreview ? 'Change' : 'Upload'} Image
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>

                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl focus:border-[#9ef87a]/50 outline-none" />
                    <div className="grid grid-cols-2 gap-6">
                      <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price ₹" className="bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl focus:border-[#9ef87a]/50 outline-none" />
                      <select value={unit} onChange={e => setUnit(e.target.value)} className="bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl focus:border-[#9ef87a]/50 outline-none">
                        <option value="kg">kg</option><option value="dozen">dozen</option><option value="piece">piece</option><option value="liter">liter</option><option value="bundle">bundle</option>
                      </select>
                    </div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Description (optional)" className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 resize-none focus:border-[#9ef87a]/50 outline-none" />

                    <div className="flex gap-6 pt-6">
                      <button type="button" onClick={() => { setShowAddModal(false); setEditingProduct(null); setImageFile(null); setImagePreview(''); }} className="flex-1 py-5 bg-gray-800 hover:bg-gray-700 rounded-2xl font-bold text-xl">Cancel</button>
                      <button type="submit" disabled={saving || uploading} className="flex-1 py-5 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-2xl font-bold text-xl hover:scale-105 transition disabled:opacity-70 flex items-center justify-center gap-3">
                        {(saving || uploading) ? <>Saving...</> : (editingProduct ? 'Update' : 'Add') + ' Product'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Placeholder for other sections (you can copy-paste products style later) */}
        {activeSection !== 'home' && activeSection !== 'products' && (
          <div className="fixed inset-0 bg-[#0E0E0E] flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-8 opacity-20">{React.createElement(menu.find(m => m.section === activeSection)?.icon || Package, { size: 120 })}</div>
              <h2 className="text-4xl font-bold mb-4">{menu.find(m => m.section === activeSection)?.title}</h2>
              <p className="text-gray-400 text-xl">Coming soon...</p>
              <button onClick={closeSection} className="mt-8 text-[#9ef87a] underline text-lg">← Back to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const DashboardWrapper = () => (
  <Suspense fallback={<div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center text-white text-3xl">Loading...</div>}>
    <DashboardPage />
  </Suspense>
);

export default DashboardWrapper;
