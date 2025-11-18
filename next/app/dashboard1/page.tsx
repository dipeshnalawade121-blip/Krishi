'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const BACKEND_URL = "https://api.krishi.site";

export default function DashboardPage() {
  const searchParams = useSearchParams();

  const userId = searchParams.get("id") || localStorage.getItem("user_id") || "";
  const googleId = searchParams.get("google_id") || "";

  const [shopName, setShopName] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      localStorage.setItem("user_id", userId);
    }
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/get-user-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.success && data.user) {
        setShopName(data.user.shop_name || "My Shop");
      }
    } catch (err) {
      console.error("Profile load error ->", err);
    }

    setLoading(false);
  };

  const go = (path: string) => {
    const googleParam = googleId ? `google_id=${googleId}&` : "";
    window.location.href = `/${path}?${googleParam}id=${userId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E0E0E] text-white">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[#0D1117] text-white font-['Inter']">

      {/* Header */}
      <h1 className="text-2xl font-bold mb-1">
        {shopName}
      </h1>
      <p className="text-[#8995a4] mb-8">Dashboard</p>

      {/* Buttons */}
      <div className="grid gap-4">
        
        {/* Products */}
        <div 
          onClick={() => go("products")}
          className="p-5 rounded-xl bg-[#101114] border border-white/5 hover:bg-[#15171c] cursor-pointer transition-all"
        >
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-[#8f9aa8] text-sm">Add / Edit products</p>
        </div>

        {/* Shop Profile */}
        <div 
          onClick={() => go("shop-profile")}
          className="p-5 rounded-xl bg-[#101114] border border-white/5 hover:bg-[#15171c] cursor-pointer transition-all"
        >
          <h2 className="text-lg font-semibold">Shop Profile</h2>
          <p className="text-[#8f9aa8] text-sm">Update shop details</p>
        </div>

        {/* Banners */}
        <div 
          onClick={() => go("banners")}
          className="p-5 rounded-xl bg-[#101114] border border-white/5 hover:bg-[#15171c] cursor-pointer transition-all"
        >
          <h2 className="text-lg font-semibold">Banners</h2>
          <p className="text-[#8f9aa8] text-sm">Upload banners</p>
        </div>

      </div>

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/login";
        }}
        className="mt-10 w-full bg-red-600 hover:bg-red-700 transition text-white py-3 rounded-lg font-semibold"
      >
        Logout
      </button>

    </div>
  );
}
