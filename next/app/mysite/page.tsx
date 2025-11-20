'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, Star, Zap, Shield, Clock, Smartphone, 
  Globe, Award, MessageCircle, Mail, Phone,
  ArrowRight, Calendar, TrendingUp, Heart
} from 'lucide-react';

const SiteGetWebsite = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    { icon: Zap, text: 'Lightning Fast (1–2 sec load time)' },
    { icon: Smartphone, text: 'Full Mobile-Friendly' },
    { icon: Shield, text: 'SSL + Hosting Setup Free' },
    { icon: Clock, text: 'Delivery: 1–3 Days' }
  ];

  const processSteps = [
    { step: '1', title: 'WhatsApp पर Contact', description: 'हमें अपने business details भेजें' },
    { step: '2', title: '₹500 Pay करें', description: 'सिक्योर पेमेंट' },
    { step: '3', title: 'Website Ready', description: '1-3 दिन में आपकी website तैयार' },
    { step: '4', title: 'Live कर देंगे', description: 'आपके domain पर website live' }
  ];

  const whyChoose = [
    { icon: '💸', title: 'Honest Pricing', description: 'No hidden charges' },
    { icon: '⚡', title: 'Super-fast', description: '1-2 second load time' },
    { icon: '🎨', title: 'Premium Design', description: 'Modern & professional' },
    { icon: '🌐', title: 'Global Hosting', description: 'Free SSL included' },
    { icon: '🔐', title: 'Full Security', description: 'Complete protection' },
    { icon: '🤝', title: 'Direct Support', description: 'WhatsApp support' }
  ];

  const faqs = [
    {
      question: 'सिर्फ ₹500 क्यों?',
      answer: 'December special offer है। नॉर्मल price ₹2000 है।'
    },
    {
      question: 'वेबसाइट बनने में कितना time लगता है?',
      answer: '1–3 दिन।'
    },
    {
      question: 'Domain included है?',
      answer: 'हाँ, हम setup कर देते हैं।'
    },
    {
      question: 'Hosting included है?',
      answer: 'हाँ, free setup।'
    },
    {
      question: 'Future में pages add होंगे?',
      answer: 'Yes, आप upgrade कर सकते हैं।'
    },
    {
      question: 'पूरी website Next.js में ही होगी?',
      answer: '100% modern stack — Next.js + Tailwind।'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#fefcff] relative overflow-x-hidden">
      {/* Dreamy Sky Pink Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)`,
        }}
      />

      {/* Top Offer Banner */}
      <div className="relative z-10 bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-4 text-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="font-bold text-lg">🎉 December Special Festival Sale!</span>
          <span className="text-sm">इस महीने अपनी प्रीमियम मॉडर्न वेबसाइट सिर्फ ₹500 में बनवाइए!</span>
          <span className="text-xs bg-white text-red-600 px-2 py-1 rounded-full font-semibold">
            ⏳ 31 December तक
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">SiteGet.in</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-blue-600 transition">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition">Pricing</a>
            <a href="#process" className="text-gray-700 hover:text-blue-600 transition">Process</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">Contact</a>
          </div>
          <a 
            href="https://wa.me/919876543210" 
            target="_blank"
            className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            🌐 अपने बिज़नेस को Online ले जाइए
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Premium Website बस ₹500 में!
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Next.js + Tailwind से बनी सुपर-फ़ास्ट, स्टाइलिश और Ultra-Modern वेबसाइट
            आपके खुद के डोमेन पर LIVE, वो भी Hosting + SSL के साथ।
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              ₹500 में अपनी वेबसाइट बनवाएँ
              <ArrowRight size={20} />
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition">
              Examples देखें
            </button>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {features.map((feature, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <feature.icon className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-gray-700 font-medium">{feature.text}</p>
              </div>
            ))}
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-gray-500 font-semibold"
          >
            Premium Technology. Minimum Price. Maximum Value.
          </motion.p>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="features" className="relative z-10 py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">हम क्या करते हैं?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              हम छोटे और मिड-बिज़नेस के लिए कस्टम प्रीमियम वेबसाइट बनाते हैं।
              आपकी ज़रूरत के हिसाब से डिज़ाइन + डेवलपमेंट + डोमेन + होस्टिंग + SSL —
              सबकुछ एक ही जगह, एक ही कीमत में।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center border border-blue-200">
            <p className="text-2xl font-semibold text-gray-900 italic">
              "Aapka business… humari technology — perfect combo!"
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section id="pricing" className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            मार्केट में कीमत इतनी ज़्यादा क्यों?
            <br />
            और SiteGet.in में इतना कम कैसे?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Market Prices */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-red-800 mb-6 text-center">💸 मार्केट प्राइस (India)</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-red-300">
                  <p className="font-semibold text-red-700">बेसिक वेबसाइट</p>
                  <p className="text-2xl font-bold text-red-800">₹50,000 – ₹1,00,000</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-red-300">
                  <p className="font-semibold text-red-700">स्टैण्डर्ड वेबसाइट</p>
                  <p className="text-2xl font-bold text-red-800">₹1,00,000 – ₹1,50,000</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-red-300">
                  <p className="font-semibold text-red-700">मॉडर्न React/Next.js वेबसाइट</p>
                  <p className="text-2xl font-bold text-red-800">₹1,50,000 – ₹3,00,000</p>
                </div>
              </div>
            </motion.div>

            {/* Our Prices */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-8 relative"
            >
              <div className="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                ⏳ LIMITED OFFER
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-6 text-center">🔥 हमारी प्राइसिंग</h3>
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-green-800">₹500</p>
                <p className="text-green-700 font-semibold">Only (December Offer)</p>
                <p className="text-gray-600 text-sm mt-2">📌 January से प्राइस: ₹2000</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-green-300 mt-6">
                <p className="text-lg font-semibold text-center text-gray-900">
                  "Technology वही, Quality वही… पर Price सिर्फ 1%!"
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Old vs Modern Website */}
      <section className="relative z-10 py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            पुरानी वेबसाइट VS Modern Website
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Old Website */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-gray-100 border border-gray-300 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-red-600 mb-6 text-center">❌ पुरानी HTML Websites</h3>
              <div className="space-y-3">
                {[
                  '🐌 बहुत धीमी (6–10 सेकंड)',
                  '📱 मोबाइल में bad experience',
                  '🎨 पुराना और boring look',
                  '🔍 SEO कमजोर, Google में rank नहीं',
                  '🔥 सस्ते server पर hosted',
                  '🧱 अपडेट करवाना मुश्किल'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 text-gray-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Modern Website */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-50 border border-blue-300 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-green-600 mb-6 text-center">✔ Modern Next.js Websites</h3>
              <div className="space-y-3">
                {[
                  '⚡ Instant load (1–2 sec)',
                  '📱 100% मोबाइल ऑप्टिमाइज़्ड',
                  '🎨 Modern, clean और premium UI',
                  '🔍 SEO powerful',
                  '🌎 Global CDN Hosting',
                  '🔐 SSL Secure',
                  '🔄 Future updates आसान'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-8 border border-orange-200 text-center"
          >
            <p className="text-xl font-semibold text-gray-900 italic">
              "पुरानी वेबसाइट = टूटी-फूटी, remote दुकान
              <br />
              नई Next.js वेबसाइट = mall-level premium showroom"
            </p>
          </motion.div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            इतना सब सिर्फ ₹500 में?!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Custom Next.js वेबसाइट',
              'Tailwind से Modern Premium डिज़ाइन',
              'Free डोमेन सेटअप',
              'Free होस्टिंग सेटअप',
              'SSL Certificate Included',
              'Super-Fast Speed Optimization',
              'Mobile Responsive Layout',
              'SEO Ready Structure',
              'Global CDN',
              'Automated Backups',
              'Live Deployment',
              'Direct WhatsApp Support'
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center space-x-3 hover:shadow-md transition"
              >
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
          >
            <p className="text-lg font-semibold text-yellow-800">
              ⚠️ January से Standard Price: ₹2000.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Speed Test Section */}
      <section className="relative z-10 py-16 px-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">स्पीड = Trust + Sales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border border-white/30"
            >
              <h3 className="text-2xl font-bold text-red-300 mb-4">⛔ पुरानी HTML वेबसाइट</h3>
              <p className="text-5xl font-bold">6–10 सेकंड</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border border-white/30"
            >
              <h3 className="text-2xl font-bold text-green-300 mb-4">✔ आपकी SiteGet.in वेबसाइट</h3>
              <p className="text-5xl font-bold">1–2 सेकंड</p>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-semibold italic"
          >
            "Fast Website = ज्यादा Customers = ज्यादा Sales."
          </motion.p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="relative z-10 py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            SiteGet.in क्यों चुनें?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChoose.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="process" className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            कैसे काम होता है?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'WhatsApp पर Contact', desc: 'हमें अपने details भेजें' },
              { step: '2', title: '₹500 Pay करें', desc: 'सिक्योर पेमेंट' },
              { step: '3', title: 'Website Ready', desc: '1-3 दिन में तैयार' },
              { step: '4', title: 'Live कर देंगे', desc: 'आपके domain पर' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="relative z-10 py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">FAQs</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center font-semibold text-gray-900 hover:bg-gray-50 transition"
                >
                  {faq.question}
                  <ArrowRight 
                    className={`w-5 h-5 transition-transform ${activeFaq === index ? 'rotate-90' : ''}`} 
                  />
                </button>
                {activeFaq === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            हमारा मिशन — हर छोटे बिज़नेस को Digital बनाना
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            SiteGet.in की शुरुआत इस सोच से हुई कि
            हर छोटा व्यापारी, दुकान, प्रोफेशनल और नया स्टार्टअप
            एक प्रीमियम वेबसाइट afford कर सके।
            <br /><br />
            हम Top tech (Next.js + Tailwind) को
            सबसे किफ़ायती दामों पर लोगों तक पहुँचाना चाहते हैं।
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-16 px-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Contact Us</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            "Website चाहिए? बस Message कर दीजिए — आपकी साइट 1–3 दिन में तैयार।"
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <a 
              href="https://wa.me/919876543210" 
              target="_blank"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-3"
            >
              <MessageCircle size={24} />
              WhatsApp Chat
            </a>
            <a 
              href="mailto:hello@siteget.in" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-3"
            >
              <Mail size={24} />
              Email Support
            </a>
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-3">
              <Phone size={24} />
              Contact Form
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold">SiteGet.in</span>
            </div>
            <p className="text-gray-400 mb-6 flex items-center justify-center gap-2">
              Made with <Heart className="w-4 h-4 text-red-400" /> by SiteGet.in
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-gray-400">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SiteGetWebsite;
