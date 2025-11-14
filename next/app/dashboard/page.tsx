'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, ArrowUpRight, ShoppingCart, Palette, Globe, Settings, Users, 
  Briefcase, HelpCircle, LogOut, Plus, ArrowLeft, Image as ImageIcon, Tag, 
  DollarSign, List, BookOpen, Layers, Check, Edit3, Trash2, Link, User, Phone, Mail, Lock
} from 'lucide-react';

// API Helper
const apiCall = async (endpoint: string, body: any) => {
  const res = await fetch(`https://api.krishi.site/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'API request failed');
  }
  return res.json();
};

// --- Types ---
type ProductFormData = {
  name: string;
  mrp: string;
  sellingPrice: string;
  description: string;
  usage: string;
  categories: string[];
  photo: string | null;
};

type BannerFormData = {
  title: string;
  url: string;
  image: string | null;
};

interface Product {
  id: number;
  name: string;
  mrp: string;
  sellingPrice: string;
  description: string;
  usage: string;
  categories: string[];
  photo: string | null;
}

interface Banner {
  id: number;
  title: string;
  image: string | null;
  url: string;
}

interface UserData {
  id: number;
  user_name: string | null;
  email: string | null;
  mobile: string | null;
  shop_name: string | null;
  shop_number: string | null;
  shop_address: string | null;
  products: Product[];
  banners: Banner[];
}

// --- Global State & Navigation Setup ---
const VIEWS = {
  DASHBOARD: 'dashboard',
  PRODUCTS: 'products',
  ADD_PRODUCT: 'addProduct',
  EDIT_PRODUCT: 'editProduct',
  BANNERS: 'banners',
  ADD_BANNER: 'addBanner',
  EDIT_BANNER: 'editBanner',
  USER_PROFILE: 'userProfile',
  SHOP_PROFILE: 'shopProfile',
};

// --- Custom Components ---

// Button component for primary actions (Add, Save)
const PrimaryButton = ({ children, onClick, icon: Icon, disabled = false }: { children: React.ReactNode; onClick?: () => void; icon?: React.ComponentType<{ className?: string }>; disabled?: boolean }) => (
  <button 
    className={`w-full flex items-center justify-center p-4 rounded-xl font-semibold transition duration-200 shadow-md ${
      disabled 
        ? 'bg-gray-400 cursor-not-allowed text-gray-500' 
        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {children}
  </button>
);

// Secondary Button (e.g., Cancel, Edit)
const SecondaryButton = ({ children, onClick, icon: Icon }: { children: React.ReactNode; onClick?: () => void; icon?: React.ComponentType<{ className?: string }> }) => (
  <button 
    className="w-full flex items-center justify-center p-4 rounded-xl font-semibold border-2 border-gray-300 hover:border-indigo-500 hover:text-indigo-600 text-gray-700 transition duration-200"
    onClick={onClick}
  >
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {children}
  </button>
);

// Input Field Component with validation support
const FormInput = ({ label, placeholder, icon: Icon, value, onChange, type = 'text', name, error, step, disabled = false }: { label: string; placeholder?: string; icon?: React.ComponentType<{ className?: string }>; value: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; name?: string; error?: string; step?: string; disabled?: boolean }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
      {label} {label.includes('Price') && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        step={step}
        disabled={disabled}
        className={`w-full pl-10 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// Textarea Component with validation
const FormTextarea = ({ label, placeholder, value, onChange, name, error, required = false, disabled = false }: { label: string; placeholder: string; value: string; onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; name?: string; error?: string; required?: boolean; disabled?: boolean }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      rows={3}
      disabled={disabled}
      className={`w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ${
        error ? 'border-red-500' : 'border-gray-300'
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// Image Upload Component
const ImageUpload = ({ label, preview, onUpload, error }: { label: string; preview?: string | null; onUpload: () => void; error?: string }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
          <button
            onClick={onUpload}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
          >
            <ImageIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ) : (
        <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition duration-150" onClick={onUpload}>
          <ImageIcon className="w-8 h-8 mb-2" />
          <span className="text-sm">Click to upload image</span>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
    <input type="file" accept="image/*" className="hidden" id="image-upload" />
  </div>
);

// --- Page View Functions ---

// Renders the main dashboard view
const renderDashboard = (setView: (view: string) => void, userData?: UserData) => {
  const ActionLink = ({ name, icon: Icon, targetView, isLogout = false }: { name: string; icon: React.ComponentType<{ className?: string }>; targetView: string; isLogout?: boolean }) => (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center justify-between w-full p-4 ${isLogout ? 'hover:bg-red-50 text-red-600' : 'hover:bg-gray-50 text-gray-800'} border-b border-gray-100 last:border-b-0 transition duration-150`}
      onClick={() => {
        if (isLogout) {
          localStorage.removeItem('userId');
          window.location.href = '/';
        } else {
          setView(targetView);
        }
      }}
    >
      <div className="flex items-center">
        <Icon className={`w-5 h-5 mr-3 ${isLogout ? 'text-red-500' : 'text-gray-700'}`} />
        <span className="text-sm font-medium">{name}</span>
      </div>
      {!isLogout && <ArrowUpRight className="w-4 h-4 text-gray-400 transform rotate-45" />}
    </motion.button>
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          className="flex items-center px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition duration-150"
          onClick={() => window.open('https://yourshop.com', '_blank')}
        >
          <Globe className="w-4 h-4 mr-1" />
          Visit Site
        </motion.button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Content & Configuration */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Content & Configuration</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ActionLink name="Products" icon={ShoppingCart} targetView={VIEWS.PRODUCTS} />
            <ActionLink name="Banners" icon={Palette} targetView={VIEWS.BANNERS} />
            <ActionLink name="Themes" icon={Globe} targetView={VIEWS.DASHBOARD} />
            <ActionLink name="Settings" icon={Settings} targetView={VIEWS.DASHBOARD} />
          </div>
        </div>

        {/* Account */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Account</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ActionLink name="User Profile" icon={Users} targetView={VIEWS.USER_PROFILE} />
            <ActionLink name="Shop Profile" icon={Briefcase} targetView={VIEWS.SHOP_PROFILE} />
            <ActionLink name="Help & Support" icon={HelpCircle} targetView={VIEWS.DASHBOARD} />
            <ActionLink name="Logout" icon={LogOut} targetView={VIEWS.DASHBOARD} isLogout />
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Modal
const CategoryModal = ({ isVisible, onClose, selectedCategories, toggleCategory }: { isVisible: boolean; onClose: () => void; selectedCategories: string[]; toggleCategory: (category: string) => void }) => {
  const categories = ['Crop Nutrition', 'Crop Protection', 'Seeds', 'Hardware'];

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Select Categories</h3>
        </div>
        <div className="p-6 space-y-3 max-h-64 overflow-y-auto">
          {categories.map((category) => (
            <motion.label 
              key={category}
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <span className="text-gray-700 text-sm font-medium">{category}</span>
              <input 
                type="checkbox" 
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </motion.label>
          ))}
        </div>
        <div className="p-6 border-t border-gray-200">
          <PrimaryButton onClick={onClose} icon={Check}>Done</PrimaryButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Product Form Component
const RenderProductForm = ({ setView, initialData, userData, setUserData, userId, isEdit, productId }: { setView: (view: string) => void; initialData?: Product; userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData | null>>; userId: string; isEdit: boolean; productId?: number }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    mrp: initialData?.mrp || '',
    sellingPrice: initialData?.sellingPrice || '',
    description: initialData?.description || '',
    usage: initialData?.usage || '',
    categories: initialData?.categories || [],
    photo: initialData?.photo || null,
  });
  const [imagePreview, setImagePreview] = useState(initialData?.photo || null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) newErrors.sellingPrice = 'Valid selling price is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setFormData(prev => ({ ...prev, photo: base64 }));
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const saveData = { ...formData, id: initialData?.id || Date.now() };
      let newProducts: Product[];
      if (isEdit && productId) {
        newProducts = userData.products.map(p => p.id === productId ? saveData as Product : p);
      } else {
        newProducts = [...(userData.products || []), saveData as Product];
      }
      if (newProducts.length > 50) throw new Error('Maximum 50 products allowed');
      setUserData(prev => prev ? { ...prev, products: newProducts } : prev);
      await apiCall('save-products', { id: userId, products: newProducts });
      alert(isEdit ? 'Product updated successfully!' : 'Product saved successfully!');
      setView(VIEWS.PRODUCTS);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.name && formData.sellingPrice && formData.description;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center bg-white shadow-sm sticky top-0 z-10">
        <button 
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition mr-4"
          onClick={() => setView(VIEWS.PRODUCTS)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit' : 'Add'} Product</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6"
        >
          <FormInput 
            label="Product Name"
            placeholder="e.g., Ultra-Grow Fertilizer"
            icon={Tag}
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />

          <ImageUpload 
            label="Product Photo"
            preview={imagePreview}
            onUpload={() => fileInputRef.current?.click()}
            error={errors.photo}
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
              label="MRP (Max Retail Price)"
              placeholder="100.00"
              icon={DollarSign}
              type="number"
              step="0.01"
              name="mrp"
              value={formData.mrp}
              onChange={handleChange}
            />
            <FormInput 
              label="Selling Price"
              placeholder="75.50"
              icon={DollarSign}
              type="number"
              step="0.01"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              error={errors.sellingPrice}
            />
          </div>

          <FormTextarea
            label="Product Description"
            placeholder="A short, compelling summary of the product..."
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            required
          />
          
          <FormTextarea
            label="Product Usage/Application"
            placeholder="Instructions on how to use the product effectively..."
            name="usage"
            value={formData.usage}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition duration-150"
              onClick={() => setShowCategoryModal(true)}
            >
              <div className="flex items-center">
                <Layers className="w-5 h-5 mr-2 text-indigo-500" />
                <span className="text-sm text-gray-700 font-medium">Select Categories</span>
              </div>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-100 px-3 py-1 rounded-full">
                {formData.categories.length} Selected
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 sticky bottom-0 space-y-2">
        <PrimaryButton onClick={handleSave} icon={Check} disabled={!isFormValid || loading}>
          {isEdit ? 'Update Product' : 'Save Product'}
        </PrimaryButton>
        <SecondaryButton onClick={() => setView(VIEWS.PRODUCTS)} icon={ArrowLeft}>
          Cancel
        </SecondaryButton>
      </div>
      
      <CategoryModal 
        isVisible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        selectedCategories={formData.categories}
        toggleCategory={toggleCategory}
      />
    </div>
  );
};

// Products List Page
const RenderProductListPage = ({ setView, userData, setUserData, userId }: { setView: (view: string) => void; userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData | null>>; userId: string }) => {
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      const newProducts = userData.products.filter(p => p.id !== id);
      setUserData(prev => prev ? { ...prev, products: newProducts } : prev);
      await apiCall('save-products', { id: userId, products: newProducts });
      alert('Product deleted!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const products = userData.products || [];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
        <button 
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition"
          onClick={() => setView(VIEWS.DASHBOARD)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Products ({products.length})</h1>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          className="flex items-center px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition duration-150"
          onClick={() => setView(VIEWS.ADD_PRODUCT)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Product
        </motion.button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {products.map((product) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                <div className="flex space-x-2">
                  <motion.button whileTap={{ scale: 0.95 }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" onClick={() => setView(`${VIEWS.EDIT_PRODUCT}-${product.id}`)}>
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-indigo-600 font-semibold text-lg">₹{product.sellingPrice}</span>
                <span className="text-gray-500 line-through">₹{product.mrp}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {product.categories.map(cat => (
                  <span key={cat} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{cat}</span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Banner Form Component
const RenderBannerForm = ({ setView, initialData, userData, setUserData, userId, isEdit, bannerId }: { setView: (view: string) => void; initialData?: Banner; userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData | null>>; userId: string; isEdit: boolean; bannerId?: number }) => {
  const [formData, setFormData] = useState<BannerFormData>({
    title: initialData?.title || '',
    url: initialData?.url || '',
    image: initialData?.image || null,
  });
  const [imagePreview, setImagePreview] = useState(initialData?.image || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Banner title is required';
    if (!formData.url.trim()) newErrors.url = 'Destination URL is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setFormData(prev => ({ ...prev, image: base64 }));
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const saveData = { ...formData, id: initialData?.id || Date.now() };
      let newBanners: Banner[];
      if (isEdit && bannerId) {
        newBanners = userData.banners.map(b => b.id === bannerId ? saveData as Banner : b);
      } else {
        newBanners = [...(userData.banners || []), saveData as Banner];
      }
      if (newBanners.length > 3) throw new Error('Maximum 3 banners allowed');
      setUserData(prev => prev ? { ...prev, banners: newBanners } : prev);
      await apiCall('save-banners', { id: userId, banners: newBanners });
      alert(isEdit ? 'Banner updated successfully!' : 'Banner saved successfully!');
      setView(VIEWS.BANNERS);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.title && formData.url;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center bg-white shadow-sm sticky top-0 z-10">
        <button 
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition mr-4"
          onClick={() => setView(VIEWS.BANNERS)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit' : 'Add'} Banner</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6"
        >
          <FormInput 
            label="Banner Title"
            placeholder="e.g., Monsoon Sale 2024"
            icon={BookOpen}
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
          />

          <ImageUpload 
            label="Banner Image"
            preview={imagePreview}
            onUpload={() => fileInputRef.current?.click()}
            error={errors.image}
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          <FormInput 
            label="Destination URL"
            placeholder="https://yourshop.com/deals"
            icon={Link}
            name="url"
            value={formData.url}
            onChange={handleChange}
            error={errors.url}
          />
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 sticky bottom-0 space-y-2">
        <PrimaryButton onClick={handleSave} icon={Check} disabled={!isFormValid || loading}>
          {isEdit ? 'Update Banner' : 'Save Banner'}
        </PrimaryButton>
        <SecondaryButton onClick={() => setView(VIEWS.BANNERS)} icon={ArrowLeft}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
};

// Banners List Page
const RenderBannerListPage = ({ setView, userData, setUserData, userId }: { setView: (view: string) => void; userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData | null>>; userId: string }) => {
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this banner?')) return;
    try {
      const newBanners = userData.banners.filter(b => b.id !== id);
      setUserData(prev => prev ? { ...prev, banners: newBanners } : prev);
      await apiCall('save-banners', { id: userId, banners: newBanners });
      alert('Banner deleted!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const banners = userData.banners || [];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
        <button 
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition"
          onClick={() => setView(VIEWS.DASHBOARD)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Banners ({banners.length})</h1>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          className="flex items-center px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition duration-150"
          onClick={() => setView(VIEWS.ADD_BANNER)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Banner
        </motion.button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {banners.map((banner) => (
          <motion.div 
            key={banner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
          >
            <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              {banner.image ? (
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-white text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-70" />
                  <p className="text-sm">Banner Image</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{banner.title}</h3>
                <div className="flex space-x-2">
                  <motion.button whileTap={{ scale: 0.95 }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" onClick={() => setView(`${VIEWS.EDIT_BANNER}-${banner.id}`)}>
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" onClick={() => handleDelete(banner.id)}>
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 truncate">URL: {banner.url}</p>
            </div>
          </motion.div>
        ))}
        {banners.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No banners yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// User Profile Page
const RenderUserProfile = ({ setView, userData, setUserData, userId }: { setView: (view: string) => void; userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData | null>>; userId: string }) => {
  const [showMobileChange, setShowMobileChange] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [showPassChange, setShowPassChange] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleSendOtp = async () => {
    if (newMobile.length !== 10) return alert('Invalid phone number');
    setMobileLoading(true);
    try {
      await apiCall('send-otp', { phone: newMobile });
      setShowOtpInput(true);
    } catch (e: any) {
      alert(e.message);
    }
    setMobileLoading(false);
  };

  const handleVerifyMobile = async () => {
    try {
      await apiCall('verify-otp', { phone: newMobile, otp });
      await apiCall('save-profile', { id: userId, mobile: newMobile });
      setUserData(prev => prev ? { ...prev, mobile: newMobile } : prev);
      setShowMobileChange(false);
      setNewMobile('');
      setOtp('');
      setShowOtpInput(false);
      alert('Mobile updated successfully!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSavePassword = async () => {
    if (newPass.length < 6) return alert('Password too short');
    if (newPass !== confirmPass) return alert('Passwords do not match');
    setPassLoading(true);
    try {
      await apiCall('reset-password', { mobile: userData.mobile, password: newPass });
      setShowPassChange(false);
      setNewPass('');
      setConfirmPass('');
      alert('Password updated successfully!');
    } catch (e: any) {
      alert(e.message);
    }
    setPassLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center bg-white shadow-sm sticky top-0 z-10">
        <button 
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition mr-4"
          onClick={() => setView(VIEWS.DASHBOARD)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6"
        >
          {/* Name */}
          <div>
            <FormInput 
              label="Name"
              value={userData.user_name || ''}
              disabled
              icon={User}
            />
            <p className="text-xs text-gray-500 mt-1">Google-linked — cannot change</p>
          </div>

          {/* Email */}
          <div>
            <FormInput 
              label="Email"
              value={userData.email || ''}
              disabled
              icon={Mail}
            />
            <p className="text-xs text-gray-500 mt-1">Google-linked — cannot change</p>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <div className="flex justify-between items-center">
              <FormInput 
                label="Mobile Number"
                placeholder=""
                value={userData.mobile || ''}
                disabled
                icon={Phone}
                
              />
              <SecondaryButton onClick={() => setShowMobileChange(true)}>Change</SecondaryButton>
            </div>
            {showMobileChange && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4"
              >
                <h4 className="font-semibold mb-2">Change Mobile Number</h4>
                <FormInput 
                  label="New Mobile Number"
                  placeholder="Enter 10-digit number"
                  type="tel"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                />
                {showOtpInput ? (
                  <div className="space-y-2">
                    <FormInput 
                      label="Enter OTP"
                      type="number"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <PrimaryButton onClick={handleVerifyMobile} disabled={otp.length !== 6 || mobileLoading}>
                      Verify & Save
                    </PrimaryButton>
                  </div>
                ) : (
                  <PrimaryButton onClick={handleSendOtp} disabled={newMobile.length !== 10 || mobileLoading}>
                    {mobileLoading ? 'Sending...' : 'Send OTP'}
                  </PrimaryButton>
                )}
                <SecondaryButton onClick={() => {
                  setShowMobileChange(false);
                  setNewMobile('');
                  setOtp('');
                  setShowOtpInput(false);
                }}>Cancel</SecondaryButton>
              </motion.div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="flex justify-between items-center">
              <FormInput 
                label="Password"
                placeholder=""
                value="•••••••••"
                disabled
                type="password"
                icon={Lock}
                
              />
              <SecondaryButton onClick={() => setShowPassChange(true)}>Change</SecondaryButton>
            </div>
            {showPassChange && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4"
              >
                <h4 className="font-semibold mb-2">Change Password</h4>
                <FormInput 
                  label="New Password"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
                <FormInput 
                  label="Confirm New Password"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
                <PrimaryButton 
                  onClick={handleSavePassword} 
                  disabled={newPass.length < 6 || newPass !== confirmPass || passLoading}
                >
                  {passLoading ? 'Saving...' : 'Save Password'}
                </PrimaryButton>
                <SecondaryButton onClick={() => {
                  setShowPassChange(false);
                  setNewPass('');
                  setConfirmPass('');
                }}>Cancel</SecondaryButton>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Shop Profile Page
const RenderShopProfile = ({ setView, userData, setUserData, userId }: { setView: (view: string) => void; userData: UserData; setUserData: React.Dispatch<React.SetStateAction<UserData | null>>; userId: string }) => {
  const [formData, setFormData] = useState({
    shop_name: userData.shop_name || '',
    shop_number: userData.shop_number || '',
    shop_address: userData.shop_address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.shop_name || !formData.shop_number || !formData.shop_address) return alert('All fields required');
    setLoading(true);
    try {
      const res = await apiCall('save-shop-profile', { id: userId, ...formData });
      if (res.success) {
        setUserData(prev => prev ? { ...prev, ...formData } : prev);
        alert('Shop profile saved!');
      }
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center bg-white shadow-sm sticky top-0 z-10">
        <button 
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition mr-4"
          onClick={() => setView(VIEWS.DASHBOARD)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Shop Profile</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6"
        >
          <FormInput 
            label="Shop Name"
            placeholder="Enter shop name"
            value={formData.shop_name}
            onChange={handleChange}
            name="shop_name"
            icon={Briefcase}
          />
          <FormInput 
            label="Shop Number"
            placeholder="Enter shop number"
            value={formData.shop_number}
            onChange={handleChange}
            name="shop_number"
            type="tel"
            icon={Phone}
          />
          <FormTextarea 
            label="Shop Address"
            placeholder="Enter full shop address"
            value={formData.shop_address || ''}
            onChange={handleChange}
            name="shop_address"
          />
        </motion.div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200 sticky bottom-0">
        <PrimaryButton onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Shop Profile'}
        </PrimaryButton>
      </div>
    </div>
  );
};

// --- Main Application Component ---

const DashboardPage: React.FC = () => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [userData, setUserData] = useState<UserData | null>(null);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const res = await apiCall('get-user-profile', { id: userId });
        if (res.success) {
          setUserData(res.user);
        }
      } catch (e: any) {
        console.error('Failed to fetch profile:', e.message);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleViewChange = (newView: string) => {
    setCurrentView(newView);
  };

  const renderContent = () => {
    const viewParts = currentView.split('-');
    const baseView = viewParts[0];
    const id = viewParts[1] ? parseInt(viewParts[1]) : undefined;

    if (!userData) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Loading...</p>
        </div>
      );
    }

    switch (baseView) {
      case VIEWS.PRODUCTS:
        return <RenderProductListPage setView={handleViewChange} userData={userData} setUserData={setUserData} userId={userId || ''} />;
      case VIEWS.ADD_PRODUCT:
        return <RenderProductForm setView={handleViewChange} initialData={undefined} userData={userData} setUserData={setUserData} userId={userId || ''} isEdit={false} productId={undefined} />;
      case VIEWS.EDIT_PRODUCT:
        const editProduct = userData.products?.find(p => p.id === id);
        if (!editProduct) {
          return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Product not found</p>
            </div>
          );
        }
        return <RenderProductForm setView={handleViewChange} initialData={editProduct} userData={userData} setUserData={setUserData} userId={userId || ''} isEdit={true} productId={id} />;
      case VIEWS.BANNERS:
        return <RenderBannerListPage setView={handleViewChange} userData={userData} setUserData={setUserData} userId={userId || ''} />;
      case VIEWS.ADD_BANNER:
        return <RenderBannerForm setView={handleViewChange} initialData={undefined} userData={userData} setUserData={setUserData} userId={userId || ''} isEdit={false} bannerId={undefined} />;
      case VIEWS.EDIT_BANNER:
        const editBanner = userData.banners?.find(b => b.id === id);
        if (!editBanner) {
          return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Banner not found</p>
            </div>
          );
        }
        return <RenderBannerForm setView={handleViewChange} initialData={editBanner} userData={userData} setUserData={setUserData} userId={userId || ''} isEdit={true} bannerId={id} />;
      case VIEWS.USER_PROFILE:
        return <RenderUserProfile setView={handleViewChange} userData={userData} setUserData={setUserData} userId={userId || ''} />;
      case VIEWS.SHOP_PROFILE:
        return <RenderShopProfile setView={handleViewChange} userData={userData} setUserData={setUserData} userId={userId || ''} />;
      case VIEWS.DASHBOARD:
      default:
        return renderDashboard(handleViewChange, userData);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans antialiased overflow-hidden">
      <motion.div
        key={currentView}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default DashboardPage;
