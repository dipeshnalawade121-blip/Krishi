'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  X, Plus, Edit2, Trash2, Loader2, Upload, Image as ImageIcon,
  Package, Image, Layout, Settings, User, Store, HelpCircle, LogOut, ArrowLeft,
  Save, Trash, Palette, Smartphone, Mail, Lock, ChevronDown, ChevronUp
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
type Banner = { id: string; url: string };
type ActiveSection = 'home' | 'products' | 'banners' | 'templates' | 'settings' | 'profile' | 'shop' | 'support';

const DashboardPage: React.FC = () => {
  const searchParams = useSearchParams();
  const userId = searchParams.get('id') || localStorage.getItem('user_id') || '';
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');

  /* ----------  SHARED DATA  ---------- */
  const [shopName, setShopName] = useState<string>('Your Shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [userProfile, setUserProfile] = useState({ user_name: '', email: '', mobile: '' });
  const [shopProfile, setShopProfile] = useState({ shop_name: '', shop_number: '', shop_address: '' });

  /* ----------  PRODUCTS  ---------- */
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

  /* ----------  BANNERS  ---------- */
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  /* ----------  TEMPLATES  ---------- */
  const [selectedTemplate, setSelectedTemplate] = useState('default');

  /* ----------  USER PROFILE (LOCKED vs EDITABLE)  ---------- */
  const [editMobile, setEditMobile] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirm, setEditConfirm] = useState('');

  /* ----------  SHOP PROFILE (ALL EDITABLE)  ---------- */
  const [editShopName, setEditShopName] = useState('');
  const [editShopNumber, setEditShopNumber] = useState('');
  const [editShopAddress, setEditShopAddress] = useState('');

  /* ----------  SUPPORT  ---------- */
  const [faqOpen, setFaqOpen] = useState<string | null>(null);
  const [contactText, setContactText] = useState('');

  /* ----------  HELPERS  ---------- */
  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 4000);
  };

  /* ----------  INITIAL FETCH  ---------- */
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
        setBanners(data.user.banners || []);
        setUserProfile({ user_name: data.user.user_name || '', email: data.user.email || '', mobile: data.user.mobile || '' });
        setShopProfile({ shop_name: data.user.shop_name || '', shop_number: data.user.shop_number || '', shop_address: data.user.shop_address || '' });
        /* initialise edit states */
        setEditMobile(data.user.mobile || '');
        setEditShopName(data.user.shop_name || '');
        setEditShopNumber(data.user.shop_number || '');
        setEditShopAddress(data.user.shop_address || '');
      }
    } catch (err) {
      showStatus('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userId]);

  /* ----------  PRODUCT HANDLERS  ---------- */
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
    if (confirm('Delete permanently?')) saveProducts(products.filter(p => p.id !== id));
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

  /* ----------  BANNER HANDLERS  ---------- */
  const uploadBannerImage = async (file: File): Promise<string | null> => {
    setBannerUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('id', userId);
    try {
      const res = await fetch(`${BACKEND_URL}/upload-banner-image`, { method: 'POST', body: formData });
      const data = await res.json();
      return data.success ? data.image_url : null;
    } catch (err: any) {
      showStatus(err.message || 'Banner upload failed', 'error');
      return null;
    } finally {
      setBannerUploading(false);
    }
  };

  const handleBannerAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (banners.length >= 3) return showStatus('Max 3 banners allowed', 'error');
    const url = await uploadBannerImage(file);
    if (!url) return;
    const updated = [...banners, { id: Date.now().toString(), url }];
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/save-banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, banners: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setBanners(updated);
        showStatus('Banner added', 'success');
      }
    } catch (err) {
      showStatus('Save banners failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = (id: string) => {
    const updated = banners.filter(b => b.id !== id);
    setSaving(true);
    fetch(`${BACKEND_URL}/save-banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, banners: updated }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setBanners(updated);
          showStatus('Banner removed', 'success');
        }
      })
      .finally(() => setSaving(false));
  };

  /* ----------  USER PROFILE SAVE (mobile only)  ---------- */
  const saveUserMobile = async () => {
    if (!editMobile.trim() || editMobile.length !== 10) return showStatus('Enter valid 10-digit mobile', 'error');
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/save-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, mobile: editMobile.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setUserProfile({ ...userProfile, mobile: editMobile.trim() });
        showStatus('Mobile updated', 'success');
      }
    } catch (err) {
      showStatus('Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ----------  PASSWORD SAVE  ---------- */
  const savePassword = async () => {
    if (!editPassword.trim() || editPassword.length < 6) return showStatus('Min 6 chars required', 'error');
    if (editPassword !== editConfirm) return showStatus('Passwords do not match', 'error');
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, password: editPassword.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showStatus('Password changed', 'success');
        setEditPassword('');
        setEditConfirm('');
      }
    } catch (err) {
      showStatus('Password change failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ----------  SHOP PROFILE SAVE  ---------- */
  const saveShopProfile = async () => {
    if (!editShopName.trim() || !editShopNumber.trim() || !editShopAddress.trim()) return showStatus('All shop fields required', 'error');
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/save-shop-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          shop_name: editShopName.trim(),
          shop_number: editShopNumber.trim(),
          shop_address: editShopAddress.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShopProfile({ shop_name: editShopName.trim(), shop_number: editShopNumber.trim(), shop_address: editShopAddress.trim() });
        setShopName(editShopName.trim());
        showStatus('Shop profile saved', 'success');
      }
    } catch (err) {
      showStatus('Shop save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ----------  SUPPORT  ---------- */
  const faqs = [
    { q: 'How to add products?', a: 'Go to Products → Add Product. Fill details and save.' },
    { q: 'How to change shop name?', a: 'Go to Shop Profile → Edit.' },
    { q: 'Max banners allowed?', a: 'You can upload up to 3 banners.' },
  ];

  const closeSection = () => setActiveSection('home');

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

  /* ----------  RENDER  ---------- */
  return (
    <>
      <div className="min-h-screen bg-[#0E0E0E] text-white font-['Inter'] overflow-hidden">
        {/* HOME */}
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
                  <button key={item.title} onClick={() => !item.special && setActiveSection(item.section)} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-10 text-left hover:scale-105 transition-all duration-300 shadow-2xl">
                    <item.icon size={56} className="mb-4 text-gray-400 group-hover:text-[#9ef87a] transition" />
                    <h3 className="text-2xl font-bold">{item.title}</h3>
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition"><span className="text-sm font-medium text-[#9ef87a]">Open →</span></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {activeSection === 'products' && (
          <div className="fixed inset-0 bg-[#0E0E0E] overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="bg-gradient-to-b from-[#101114] to-[#0E0E0E] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={closeSection} className="lg:hidden"><ArrowLeft size={32} /></button>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">Products</h1>
                      <p className="text-gray-400">{shopName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-br from-[#9ef87a] to-[#009e57] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition"><Plus size={24} /> Add Product</button>
                </div>
              </div>

              <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                {status && <div className={`p-4 rounded-xl mb-6 text-center ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>{status.text}</div>}
                {loading ? (
                  <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#9ef87a]" size={60} /></div>
                ) : products.length === 0 ? (
                  <div className="text-center py-32">
                    <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-3xl w-40 h-40 mx-auto mb-8 flex items-center justify-center"><ImageIcon size={80} className="text-gray-500" /></div>
                    <h3 className="text-3xl font-bold mb-4">No products yet</h3>
                    <button onClick={() => setShowAddModal(true)} className="text-[#9ef87a] text-xl underline">Add your first product →</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map(p => (
                      <div key={p.id} className="group bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 overflow-hidden shadow-2xl hover:scale-105 transition-all">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-64 object-cover" /> : <div className="h-64 bg-gray-800/50 flex items-center justify-center"><ImageIcon size={70} className="text-gray-600" /></div>}
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

            {/* Add/Edit Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-8 border-b border-white/10">
                    <h2 className="text-3xl font-bold">{editingProduct ? 'Edit' : 'Add'} Product</h2>
                    <button onClick={() => { setShowAddModal(false); setEditingProduct(null); setImageFile(null); setImagePreview(''); }} className="p-3 hover:bg-white/10 rounded-xl"><X size={32} /></button>
                  </div>
                  <form onSubmit={handleProductSubmit} className="p-8 space-y-8">
                    <div className="flex items-center gap-6">
                      {imagePreview ? <img src={imagePreview} alt="prev" className="w-32 h-32 object-cover rounded-2xl" /> : <div className="w-32 h-32 bg-gray-800/50 border-2 border-dashed rounded-2xl flex items-center justify-center"><ImageIcon size={48} className="text-gray-500" /></div>}
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 transition"><Upload size={28} /> {imagePreview ? 'Change' : 'Upload'} Image</button>
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
                      <button type="submit" disabled={saving || uploading} className="flex-1 py-5 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-2xl font-bold text-xl hover:scale-105 transition disabled:opacity-70 flex items-center justify-center gap-3">{(saving || uploading) ? <>Saving...</> : (editingProduct ? 'Update' : 'Add') + ' Product'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BANNERS */}
        {activeSection === 'banners' && (
          <div className="fixed inset-0 bg-[#0E0E0E] overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="bg-gradient-to-b from-[#101114] to-[#0E0E0E] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={closeSection} className="lg:hidden"><ArrowLeft size={32} /></button>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">Banners</h1>
                      <p className="text-gray-400">Max 3 banners • Drag to reorder</p>
                    </div>
                  </div>
                  <button onClick={() => bannerFileRef.current?.click()} disabled={bannerUploading || saving} className="bg-gradient-to-br from-[#9ef87a] to-[#009e57] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition disabled:opacity-70"><Plus size={24} /> Add Banner</button>
                  <input ref={bannerFileRef} type="file" accept="image/*" onChange={handleBannerAdd} className="hidden" />
                </div>
              </div>

              <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                {status && <div className={`p-4 rounded-xl mb-6 text-center ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>{status.text}</div>}
                {loading ? (
                  <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#9ef87a]" size={60} /></div>
                ) : banners.length === 0 ? (
                  <div className="text-center py-32">
                    <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-3xl w-40 h-40 mx-auto mb-8 flex items-center justify-center"><ImageIcon size={80} className="text-gray-500" /></div>
                    <h3 className="text-3xl font-bold mb-4">No banners yet</h3>
                    <button onClick={() => bannerFileRef.current?.click()} className="text-[#9ef87a] text-xl underline">Upload your first banner →</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {banners.map((b, idx) => (
                      <div key={b.id} className="group relative bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                        <img src={b.url} alt="banner" className="w-full h-64 object-cover" />
                        <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition">
                          <button disabled={saving} onClick={() => deleteBanner(b.id)} className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-xl"><Trash size={22} /></button>
                        </div>
                        <div className="p-4 text-center text-gray-400">Banner {idx + 1}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATES */}
        {activeSection === 'templates' && (
          <div className="fixed inset-0 bg-[#0E0E0E] overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="bg-gradient-to-b from-[#101114] to-[#0E0E0E] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={closeSection} className="lg:hidden"><ArrowLeft size={32} /></button>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">Templates</h1>
                      <p className="text-gray-400">Choose a storefront theme</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { id: 'default', name: 'Fresh', available: true, thumb: 'https://via.placeholder.com/400x300/9ef87a/000?text=Fresh' },
                    { id: 'minimal', name: 'Minimal', available: false, thumb: 'https://via.placeholder.com/400x300/009e57/fff?text=Minimal' },
                    { id: 'dark', name: 'Night', available: false, thumb: 'https://via.placeholder.com/400x300/222/fff?text=Night' },
                  ].map(t => (
                    <div key={t.id} className={`group relative bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border ${selectedTemplate === t.id ? 'border-[#9ef87a]' : 'border-white/10'} overflow-hidden shadow-2xl hover:scale-105 transition-all`}>
                      <img src={t.thumb} alt={t.name} className="w-full h-64 object-cover" />
                      <div className="p-6 flex items-center justify-between">
                        <h3 className="text-2xl font-bold">{t.name}</h3>
                        {t.available ? (
                          <button disabled={saving} onClick={() => { setSelectedTemplate(t.id); showStatus('Template selected (frontend only)', 'success'); }} className="px-6 py-3 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-xl font-bold hover:scale-105 transition disabled:opacity-70">{selectedTemplate === t.id ? 'Selected' : 'Select'}</button>
                        ) : (
                          <span className="px-6 py-3 bg-gray-800 rounded-xl font-bold text-gray-400">Coming Soon</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER PROFILE (LOCKED vs EDITABLE) */}
        {activeSection === 'profile' && (
          <div className="fixed inset-0 bg-[#0E0E0E] overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="bg-gradient-to-b from-[#101114] to-[#0E0E0E] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={closeSection} className="lg:hidden"><ArrowLeft size={32} /></button>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">User Profile</h1>
                      <p className="text-gray-400">Manage your personal info</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
                {status && <div className={`p-4 rounded-xl mb-6 text-center ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>{status.text}</div>}
                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 p-8 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-300 mb-2">Personal Information</h2>
                  <div>
                    <label className="block text-gray-400 mb-2">Name</label>
                    <input value={userProfile.user_name} disabled className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl opacity-70 cursor-not-allowed" />
                    <p className="text-xs text-gray-500 mt-2">Locked</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Email</label>
                    <input value={userProfile.email} disabled className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl opacity-70 cursor-not-allowed" />
                    <p className="text-xs text-gray-500 mt-2">Locked</p>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Mobile</label>
                    <input value={editMobile} onChange={e => setEditMobile(e.target.value)} placeholder="10-digit mobile" maxLength={10} className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl focus:border-[#9ef87a]/50 outline-none" />
                  </div>
                  <div className="flex justify-end">
                    <button disabled={saving} onClick={saveUserMobile} className="px-8 py-4 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-2xl font-bold text-xl hover:scale-105 transition disabled:opacity-70 flex items-center gap-3"><Save size={24} /> Save Mobile</button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 p-8 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-300 mb-2">Security</h2>
                  <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="New password (min 6)" className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl focus:border-[#9ef87a]/50 outline-none" />
                  <input type="password" value={editConfirm} onChange={e => setEditConfirm(e.target.value)} placeholder="Confirm password" className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl focus:border-[#9ef87a]/50 outline-none" />
                  <div className="flex justify-end">
                    <button disabled={saving} onClick={savePassword} className="px-8 py-4 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-2xl font-bold text-xl hover:scale-105 transition disabled:opacity-70 flex items-center gap-3"><Lock size={24} /> Update Password</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHOP PROFILE (ALL EDITABLE) */}
        {activeSection === 'shop' && (
          <div className="fixed inset-0 bg-[#0E0E0E] overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="bg-gradient-to-b from-[#101114] to-[#0E0E0E] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={closeSection} className="lg:hidden"><ArrowLeft size={32} /></button>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">Shop Profile</h1>
                      <p className="text-gray-400">Update your shop details</p>
                    </div>
                  </div>
                  <button disabled={saving} onClick={saveShopProfile} className="bg-gradient-to-br from-[#9ef87a] to-[#009e57] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition disabled:opacity-70"><Save size={24} /> Save Shop</button>
                </div>
              </div>

              <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
                {status && <div className={`p-4 rounded-xl mb-6 text-center ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>{status.text}</div>}
                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 p-8 space-y-6">
                  <div>
                    <label className="block text-gray-400 mb-2">Shop Name</label>
                    <input value={editShopName} onChange={e => setEditShopName(e.target.value)} placeholder="Shop name" className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl focus:border-[#9ef87a]/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Shop Number</label>
                    <input value={editShopNumber} onChange={e => setEditShopNumber(e.target.value)} placeholder="Contact number" className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 text-xl focus:border-[#9ef87a]/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Shop Address</label>
                    <textarea value={editShopAddress} onChange={e => setEditShopAddress(e.target.value)} rows={4} placeholder="Full address" className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 resize-none focus:border-[#9ef87a]/50 outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeSection === 'settings' && (
          <div className="fixed inset-0 bg-[#0E0E0E] overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="bg-gradient-to-b from-[#101114] to-[#0E0E0E] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={closeSection} className="lg:hidden"><ArrowLeft size={32} /></button>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">Settings</h1>
                      <p className="text-gray-400">Manage your preferences</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-12">
                {status && <div className={`p-4 rounded-xl text-center ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>{status.text}</div>}
                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 p-8 space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3"><Palette size={28} /> Preferences</h2>
                  <div className="flex items-center justify-between"><span className="text-lg">Dark mode</span><span className="px-4 py-2 bg-gray-800 rounded-xl text-gray-400">Coming Soon</span></div>
                  <div className="flex items-center justify-between"><span className="text-lg">Notifications</span><span className="px-4 py-2 bg-gray-800 rounded-xl text-gray-400">Coming Soon</span></div>
                  <div className="flex items-center justify-between"><span className="text-lg">Billing</span><span className="px-4 py-2 bg-gray-800 rounded-xl text-gray-400">Coming Soon</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUPPORT */}
        {activeSection === 'support' && (
          <div className="fixed inset-0 bg-[#0E0E0E] overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="bg-gradient-to-b from-[#101114] to-[#0E0E0E] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={closeSection} className="lg:hidden"><ArrowLeft size={32} /></button>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent">Help & Support</h1>
                      <p className="text-gray-400">We're here to help</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-12">
                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3"><Smartphone size={28} /> WhatsApp Support</h2>
                  <a href="https://wa.me/?text=Hi%20Krishi%20Support" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-2xl font-bold text-xl hover:scale-105 transition">Chat on WhatsApp</a>
                </div>

                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 p-8 space-y-4">
                  <h2 className="text-2xl font-bold mb-4">FAQ</h2>
                  {faqs.map(f => (
                    <div key={f.q} className="border-b border-white/10 pb-4">
                      <button onClick={() => setFaqOpen(faqOpen === f.q ? null : f.q)} className="w-full flex items-center justify-between text-left text-lg font-semibold">
                        {f.q}
                        {faqOpen === f.q ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </button>
                      {faqOpen === f.q && <p className="mt-3 text-gray-400">{f.a}</p>}
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 p-8 space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3"><Mail size={28} /> Contact Us</h2>
                  <textarea value={contactText} onChange={e => setContactText(e.target.value)} rows={5} placeholder="Tell us how we can help..." className="w-full bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-5 resize-none focus:border-[#9ef87a]/50 outline-none" />
                  <div className="flex justify-end">
                    <button disabled={saving} onClick={() => { showStatus('Message sent (demo)', 'success'); setContactText(''); }} className="px-8 py-4 bg-gradient-to-br from-[#9ef87a] to-[#009e57] rounded-2xl font-bold text-xl hover:scale-105 transition disabled:opacity-70">Send Message</button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/10 p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Raise a Ticket</h2>
                  <p className="text-gray-400 mb-6">Get help from our team</p>
                  <span className="px-6 py-3 bg-gray-800 rounded-xl text-gray-400">Coming Soon</span>
                </div>
              </div>
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
