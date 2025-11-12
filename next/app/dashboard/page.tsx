'use client';

import React, { useState } from 'react';
import { 
  Eye, ArrowUpRight, ShoppingCart, Palette, Globe, Settings, Users, 
  Briefcase, HelpCircle, LogOut, Plus, ArrowLeft, Image as ImageIcon, Tag, 
  DollarSign, List, BookOpen, Layers, Check
} from 'lucide-react';

// --- Global State & Navigation Setup ---
const VIEWS = {
  DASHBOARD: 'dashboard',
  PRODUCTS: 'products',
  ADD_PRODUCT: 'addProduct',
  BANNERS: 'banners',
  ADD_BANNER: 'addBanner',
};

// --- Custom Components ---

// Button component for primary actions (Add, Save)
const PrimaryButton = ({ children, onClick, icon: Icon, disabled = false }) => (
  <button 
    className={`w-full flex items-center justify-center p-3 rounded-xl font-semibold transition duration-150 ${
      disabled 
        ? 'bg-gray-400 cursor-not-allowed' 
        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {children}
  </button>
);

// Input Field Component
const FormInput = ({ label, placeholder, icon: Icon, value, onChange, type = 'text', name }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition duration-150">
      <div className="p-3 text-gray-400">
        <Icon className="w-5 h-5" />
      </div>
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        className="flex-1 p-3 text-sm text-gray-900 focus:outline-none"
      />
    </div>
  </div>
);

// Textarea Component
const FormTextarea = ({ label, placeholder, value, onChange, name }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      rows={3}
      className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
    />
  </div>
);

// --- Modal Component for Category Selection ---
const CategoryModal = ({ isVisible, onClose, selectedCategories, toggleCategory }) => {
  const categories = [
    'Crop Nutrition',
    'Crop Protection',
    'Seeds',
    'Hardware'
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Select Categories</h3>
        </div>
        <div className="p-5 space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center justify-between">
              <label className="text-gray-700 text-sm font-medium">{category}</label>
              <input 
                type="checkbox" 
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-gray-200">
          <PrimaryButton onClick={onClose} icon={Check}>
            Done
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

// --- Page View Functions ---

// Renders the main dashboard view
const DashboardView = ({ setView }) => {
  const ActionLink = ({ name, icon: Icon, targetView }) => (
    <button 
      className="flex items-center justify-between w-full p-4 bg-white hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition duration-150"
      onClick={() => setView(targetView)}
    >
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3 text-gray-700" />
        <span className="text-sm font-medium text-gray-800">{name}</span>
      </div>
      <ArrowUpRight className="w-4 h-4 text-gray-400 transform rotate-45" />
    </button>
  );

  const MetricCard = ({ title, value, icon: Icon }) => (
    <div className="p-5 bg-indigo-500 rounded-xl shadow-lg text-white flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold opacity-90">{title}</p>
        <p className="text-4xl font-extrabold mt-1">{value}</p>
      </div>
      <Icon className="w-10 h-10 opacity-70" />
    </div>
  );

  return (
    <>
      {/* 1. TOP: Visit Site Button & Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <button 
          className="flex items-center p-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition duration-150"
          onClick={() => console.log('Navigating to Live Site')}
        >
          <Globe className="w-4 h-4 mr-1" />
          Visit Site
        </button>
      </div>

      {/* 2. METRICS: Page Visits (Small Column) */}
      <div className="p-4">
        <MetricCard
          title="Page Visits (30 Days)"
          value="18,452"
          icon={Eye}
        />
      </div>

      {/* 3. MAIN GROUPED LINKS (Product/Banner/Theme/Settings) */}
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Content & Configuration</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <ActionLink name="Products" icon={ShoppingCart} targetView={VIEWS.PRODUCTS} />
          <ActionLink name="Banners" icon={Palette} targetView={VIEWS.BANNERS} />
          <ActionLink name="Themes" icon={Globe} targetView={VIEWS.DASHBOARD} />
          <ActionLink name="Settings" icon={Settings} targetView={VIEWS.DASHBOARD} />
        </div>
      </div>

      {/* 4. BOTTOM: User/Shop/Support/Logout Links */}
      <div className="p-4 mt-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Account</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <ActionLink name="User Profile" icon={Users} targetView={VIEWS.DASHBOARD} />
          <ActionLink name="Shop Profile" icon={Briefcase} targetView={VIEWS.DASHBOARD} />
          <ActionLink name="Help & Support" icon={HelpCircle} targetView={VIEWS.DASHBOARD} />
          
          <button 
            className="flex items-center justify-start w-full p-4 bg-white hover:bg-red-50 text-red-600 rounded-b-xl transition duration-150"
            onClick={() => console.log('Logout action initiated')}
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

// --- Add Product Page ---
const AddProductView = ({ setView }) => {
  const [product, setProduct] = useState({
    name: '',
    mrp: '',
    sellingPrice: '',
    description: '',
    usage: '',
    categories: [],
    photo: null,
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (category: string) => {
    setProduct(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleSave = () => {
    console.log('--- Product Saved ---');
    console.log(product);
    // Add logic for API call here
    alert('Product saved successfully! (Check console for data)');
    setView(VIEWS.PRODUCTS); // Return to products list after saving
  };
  
  const isFormValid = product.name && product.sellingPrice && product.description;

  return (
    <>
      {/* Header: Return Arrow and Title */}
      <div className="p-4 border-b border-gray-100 flex items-center bg-white sticky top-0 z-10 shadow-sm">
        <button 
          className="p-1 text-gray-600 hover:text-gray-900 transition mr-4"
          onClick={() => setView(VIEWS.PRODUCTS)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
      </div>

      <div className="p-4 overflow-y-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-200">
          
          {/* Product Name */}
          <FormInput 
            label="Product Name"
            placeholder="e.g., Ultra-Grow Fertilizer"
            icon={Tag}
            name="name"
            value={product.name}
            onChange={handleChange}
          />

          {/* Product Photo Placeholder */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Photo</label>
            <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition duration-150">
              <ImageIcon className="w-6 h-6 mr-2" />
              <span className="text-sm">Click to upload photo (Placeholder)</span>
            </div>
          </div>
          
          {/* Price Columns (MRP / Selling Price) */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput 
              label="MRP (Max Retail Price)"
              placeholder="100.00"
              icon={DollarSign}
              type="number"
              name="mrp"
              value={product.mrp}
              onChange={handleChange}
            />
            <FormInput 
              label="Selling Price"
              placeholder="75.50"
              icon={DollarSign}
              type="number"
              name="sellingPrice"
              value={product.sellingPrice}
              onChange={handleChange}
            />
          </div>

          {/* Product Description */}
          <FormTextarea
            label="Product Description"
            placeholder="A short, compelling summary of the product..."
            name="description"
            value={product.description}
            onChange={handleChange}
          />
          
          {/* Product Usage */}
          <FormTextarea
            label="Product Usage/Application"
            placeholder="Instructions on how to use the product effectively..."
            name="usage"
            value={product.usage}
            onChange={handleChange}
          />

          {/* Select Categories Button */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
            <button 
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition duration-150"
              onClick={() => setShowCategoryModal(true)}
            >
              <div className='flex items-center'>
                <Layers className="w-5 h-5 mr-2 text-indigo-500" />
                <span className="text-sm text-gray-700 font-medium">Select Categories</span>
              </div>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-100 px-2 py-1 rounded-full">
                {product.categories.length} Selected
              </span>
            </button>
          </div>
        </div>

        {/* Save Product Button */}
        <div className="p-4 bg-gray-100 sticky bottom-0 border-t border-gray-200">
            <PrimaryButton onClick={handleSave} icon={Check} disabled={!isFormValid}>
                Save Product
            </PrimaryButton>
        </div>
      </div>
      
      {/* Category Selection Modal */}
      <CategoryModal 
        isVisible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        selectedCategories={product.categories}
        toggleCategory={toggleCategory}
      />
    </>
  );
};

// --- Products List Page ---
const ProductsView = ({ setView }) => (
  <>
    {/* Header: Return Arrow, Title, Add Product Button */}
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
      <button 
        className="p-1 text-gray-600 hover:text-gray-900 transition"
        onClick={() => setView(VIEWS.DASHBOARD)}
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
      <h1 className="text-xl font-bold text-gray-900">Products ({12})</h1>
      <button 
        className="p-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition duration-150 flex items-center"
        onClick={() => setView(VIEWS.ADD_PRODUCT)}
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Product
      </button>
    </div>

    {/* Content: Product List Placeholder */}
    <div className="p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">
          Placeholder for a list of existing products.
        </p>
      </div>
    </div>
  </>
);

// --- Banner Pages ---
const BannersView = ({ setView }) => (
  <>
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
      <button 
        className="p-1 text-gray-600 hover:text-gray-900 transition"
        onClick={() => setView(VIEWS.DASHBOARD)}
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
      <h1 className="text-xl font-bold text-gray-900">Banners ({3})</h1>
      <button 
        className="p-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition duration-150 flex items-center"
        onClick={() => setView(VIEWS.ADD_BANNER)}
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Banner
      </button>
    </div>
    <div className="p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">
          Placeholder for a list of existing banners.
        </p>
      </div>
    </div>
  </>
);

const AddBannerView = ({ setView }) => {
  const [banner, setBanner] = useState({
    title: '',
    destinationUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBanner(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log('Banner saved!', banner);
    setView(VIEWS.BANNERS);
  };
    
  return (
    <>
      <div className="p-4 border-b border-gray-100 flex items-center bg-white sticky top-0 z-10 shadow-sm">
        <button 
          className="p-1 text-gray-600 hover:text-gray-900 transition mr-4"
          onClick={() => setView(VIEWS.BANNERS)}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Add New Banner</h1>
      </div>

      <div className="p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-200">
          <FormInput 
            label="Banner Title"
            placeholder="e.g., Monsoon Sale 2024"
            icon={BookOpen}
            name="title"
            value={banner.title}
            onChange={handleChange}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
            <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition duration-150">
              <ImageIcon className="w-6 h-6 mr-2" />
              <span className="text-sm">Click to upload banner creative</span>
            </div>
          </div>
          <FormInput 
            label="Destination URL"
            placeholder="https://yourshop.com/deals"
            icon={Globe}
            name="destinationUrl"
            value={banner.destinationUrl}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="p-4 bg-gray-100 sticky bottom-0 border-t border-gray-200">
        <PrimaryButton onClick={handleSave} icon={Check}>
          Save Banner
        </PrimaryButton>
      </div>
    </>
  );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);

  const renderContent = () => {
    switch (currentView) {
      case VIEWS.PRODUCTS:
        return <ProductsView setView={setCurrentView} />;
      case VIEWS.ADD_PRODUCT:
        return <AddProductView setView={setCurrentView} />;
      case VIEWS.BANNERS:
        return <BannersView setView={setCurrentView} />;
      case VIEWS.ADD_BANNER:
        return <AddBannerView setView={setCurrentView} />;
      case VIEWS.DASHBOARD:
      default:
        return <DashboardView setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-0 font-sans antialiased">
      {/* Dashboard Container */}
      <div className="w-full max-w-sm bg-white shadow-2xl overflow-hidden md:rounded-2xl">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
