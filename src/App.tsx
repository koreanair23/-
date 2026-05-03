import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  LogIn, 
  LogOut, 
  ChevronRight,
  Package,
  ShoppingBag,
  Heart,
  X,
  Edit2,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, Product } from './constants';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formState, setFormState] = useState({ 
    name: '', 
    imageUrl: '', 
    category: 'sale' as const, 
    description: '', 
    additionalImages: [] as string[] 
  });
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const ADMIN_EMAIL = 'jun090990927@gmail.com';

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL);
      setLoading(false);
    });

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      setShowLogin(false);
    } catch (error) {
      alert('로그인에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAdmin(false);
    } catch (error) {
      alert('로그아웃에 실패했습니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isGallery) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormState(prev => ({
            ...prev,
            additionalImages: [...prev.additionalImages, reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    } else {
      const reader = new FileReader();
      const file = files[0];
      reader.onloadend = () => {
        setFormState(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.imageUrl) {
      alert('상품명과 이미지는 필수입니다.');
      return;
    }

    try {
      if (isEditing) {
        const productRef = doc(db, 'products', isEditing);
        await updateDoc(productRef, {
          name: formState.name,
          imageUrl: formState.imageUrl,
          category: formState.category,
          description: formState.description,
          additionalImages: formState.additionalImages
        });
        setIsEditing(null);
      } else {
        await addDoc(collection(db, 'products'), {
          ...formState,
          createdAt: serverTimestamp(),
        });
      }
      setFormState({ name: '', imageUrl: '', category: 'sale', description: '', additionalImages: [] });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('이 물품을 정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const startEdit = (product: Product) => {
    setIsEditing(product.id);
    setFormState({
      name: product.name,
      imageUrl: product.imageUrl,
      category: product.category as any,
      description: product.description || '',
      additionalImages: product.additionalImages || []
    });
    document.getElementById('edit-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#000F1D]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#C29B2C] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-[#F4E8C8] selection:text-[#000F1D] bg-slate-50 font-sans">
      {/* 내비게이션 */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 h-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[#000F1D] font-display font-black text-xl md:text-2xl tracking-tighter leading-none">
              김포 제일하나의료기
            </span>
            <span className="text-[10px] text-[#C29B2C] uppercase tracking-widest font-bold mt-1">
              당신의 건강을 지켜드리는 제일하나의료기
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="tel:031-989-7295" 
              className="hidden md:flex items-center gap-2 bg-[#000F1D] text-[#D4AF37] px-6 py-2.5 rounded-full font-bold hover:bg-[#001A33] transition-all shadow-lg hover:shadow-[#C29B2C]/20 active:scale-95"
            >
              <Phone size={18} />
              상담 전화 연결
            </a>
            <a 
              href="tel:031-989-7295" 
              className="md:hidden p-3 bg-[#000F1D] text-[#D4AF37] rounded-full shadow-lg shadow-[#C29B2C]/20"
            >
              <Phone size={24} />
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* 메인 배너 */}
        <section className="relative h-[70vh] min-h-[500px] flex items-center overflow-hidden bg-[#000F1D]">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#000F1D] via-[#000F1D]/60 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=2000" 
              alt="의료기기 매장" 
              className="w-full h-full object-cover opacity-60 scale-105"
            />
          </div>

          <div className="relative z-20 max-w-7xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <span className="inline-block px-4 py-1.5 bg-[#C29B2C]/20 text-[#D4AF37] border border-[#C29B2C]/30 rounded-full text-sm font-bold mb-6">
                김포 어르신의 건강한 내일
              </span>
              <h1 className="text-4xl md:text-7xl font-display text-white font-black leading-[1.1] mb-6">
                김포 하나의료기가 <br />
                <span className="text-[#D4AF37] italic">함께합니다.</span>
              </h1>
              <p className="text-white text-lg md:text-xl mb-10 leading-relaxed font-medium drop-shadow-md">
                당신의 건강을 지켜드리는 김포 제일하나의료기입니다.<br />
                노인 장기 요양 보험 등급을 받으신 어르신들을 위해<br />
                다양한 복지용구를 전문적으로 취급하고 있습니다.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#catalog" className="bg-[#C29B2C] text-[#000F1D] px-8 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-[#D4AF37] transition-all shadow-xl shadow-[#C29B2C]/30 hover:-translate-y-1">
                  복지용구 물품 구경하기 <ChevronRight size={20} />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3대 핵심 프로그램 */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-black text-[#000F1D] mb-4 tracking-tighter">
                핵심 서비스 안내
              </h2>
              <p className="text-slate-900 max-w-xl mx-auto font-bold text-lg">
                어르신과 가족분들의 삶의 질을 높이기 위한 세 가지 맞춤형 솔루션을 제공합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map((key, idx) => {
                const cat = CATEGORIES[key];
                const Icon = key === 'sale' ? ShoppingBag : key === 'rental' ? Package : Heart;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.6 }}
                    className="group bg-slate-50 p-10 rounded-3xl border border-slate-200 hover:border-[#C29B2C] transition-all hover:shadow-2xl"
                  >
                    <div className="w-16 h-16 bg-[#000F1D] rounded-2xl flex items-center justify-center text-[#D4AF37] mb-8 group-hover:scale-110 transition-transform shadow-xl">
                      <Icon size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-[#000F1D] mb-4">{cat.title}</h3>
                    <p className="text-[#000F1D] font-extrabold text-lg leading-snug mb-6 italic border-l-4 border-[#C29B2C] pl-4">
                      "{cat.description}"
                    </p>
                    <p className="text-slate-900 text-base leading-relaxed font-medium">
                      {cat.details}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 물품 카탈로그 */}
        <section id="catalog" className="py-24 bg-slate-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div className="max-w-2xl text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-display font-black text-[#000F1D] mb-6 tracking-tighter">
                  주요 취급 물품 <span className="text-[#C29B2C] italic">목록</span>
                </h2>
                <p className="text-slate-900 text-lg font-bold">
                  매장에서 직접 보시고 선택하실 수 있는 믿을 수 있는 제품들입니다. 클릭하여 상세 정보를 확인하세요.
                </p>
              </div>
              
              {isAdmin && (
                <div className="flex justify-center">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all border border-red-100"
                  >
                    <LogOut size={20} /> 관리자 로그아웃
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10">
              <AnimatePresence mode="popLayout">
                {products.map((product) => (
                  <motion.div 
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedProduct(product)}
                    className="group relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all border border-slate-200 cursor-pointer"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-4 md:p-6 bg-white relative">
                      <span className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#C29B2C] font-black mb-1 md:mb-2 block">
                        {CATEGORIES[product.category]?.title || '의료기기'}
                      </span>
                      <h4 className="text-[#000F1D] font-extrabold text-base md:text-xl truncate mb-1">
                        {product.name}
                      </h4>

                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-1 md:top-4 md:right-4 flex-col md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(product);
                            }}
                            className="p-2 bg-[#000F1D] text-[#D4AF37] rounded-full shadow-xl hover:bg-[#001A33] transition-all z-10"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProduct(product.id);
                            }}
                            className="p-2 bg-red-600 text-white rounded-full shadow-xl hover:bg-red-700 transition-all z-10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 관리자 물품 관리 구역 */}
            {isAdmin && (
              <div id="edit-section" className="mt-24 bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-100">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-[#000F1D] text-[#D4AF37] rounded-2xl flex items-center justify-center shadow-lg">
                    <Plus size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-[#000F1D]">{isEditing ? '물품 정보 수정' : '새 상품 등록'}</h3>
                    <p className="text-slate-500 font-bold">매장 쇼룸에 표시될 정보를 입력하세요.</p>
                  </div>
                </div>

                <form onSubmit={addOrUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">물품 이름</label>
                      <input 
                        type="text" 
                        placeholder="예: 수동 휠체어 A형" 
                        required
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C29B2C] bg-slate-50 font-bold"
                        value={formState.name}
                        onChange={e => setFormState({...formState, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">카테고리</label>
                      <select 
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C29B2C] appearance-none bg-slate-50 font-bold cursor-pointer"
                        value={formState.category}
                        onChange={e => setFormState({...formState, category: e.target.value as any})}
                      >
                        <option value="sale">판매 용품</option>
                        <option value="rental">복지용구 대여</option>
                        <option value="premium">비급여/프리미엄</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">상세 설명</label>
                      <textarea 
                        rows={5}
                        placeholder="물품의 특징이나 장점을 적어주세요."
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C29B2C] bg-slate-50 font-bold resize-none"
                        value={formState.description}
                        onChange={e => setFormState({...formState, description: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">대표 이미지 (메인 사진)</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[4/3] w-full border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all overflow-hidden"
                      >
                        {formState.imageUrl ? (
                          <img src={formState.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon className="text-slate-300 mb-4" size={48} />
                            <p className="text-slate-400 font-bold">클릭하여 사진 업로드</p>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(e)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-[#000F1D] mb-2">추가 사진 (상세 갤러리)</label>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {formState.additionalImages.map((src, idx) => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden relative">
                            <img src={src} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setFormState(prev => ({ ...prev, additionalImages: prev.additionalImages.filter((_, i) => i !== idx) }))}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <button 
                          type="button"
                          onClick={() => multiFileInputRef.current?.click()}
                          className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-50"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      <input 
                        type="file" 
                        ref={multiFileInputRef}
                        className="hidden" 
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, true)}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      {isEditing && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditing(null);
                            setFormState({ name: '', imageUrl: '', category: 'sale', description: '', additionalImages: [] });
                          }}
                          className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl font-black hover:bg-slate-300 active:scale-95 transition-all"
                        >
                          취소
                        </button>
                      )}
                      <button type="submit" className="flex-[2] bg-[#000F1D] text-[#D4AF37] py-4 rounded-2xl font-black hover:bg-[#001A33] shadow-xl active:scale-95 transition-all">
                        {isEditing ? '변경사항 저장하기' : '상품 등록하기'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* 매장 정보 및 지도 */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-16">
                <div>
                  <h2 className="text-3xl md:text-5xl font-display font-black text-[#000F1D] mb-8 tracking-tighter leading-tight">
                    오시는 길 <span className="text-[#C29B2C]">&</span> <br /> 매장 상세 정보
                  </h2>
                  <p className="text-slate-900 text-xl font-medium leading-relaxed max-w-lg">
                    경기도 김포시 통진읍에 위치한 복지용구 전문 매장입니다. <br />
                    어르신들이 불편함 없이 방문하실 수 있도록 쾌적한 환경을 조성하였습니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 shrink-0 bg-slate-50 text-[#C29B2C] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#000F1D] text-lg mb-2 italic">매장 주소</h4>
                      <p className="text-slate-900 font-bold leading-snug">경기도 김포시 통진읍 흥신로 320-8</p>
                      <a 
                        href="https://map.naver.com/p/search/%EA%B9%80%ED%8F%AC%ED%95%98%EB%82%98%EC%9D%98%EB%A3%8C%EA%B8%B0/place/58423783" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-600 font-bold text-sm flex items-center gap-1 mt-2 hover:underline"
                      >
                        네이버 지도로 보기 <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 shrink-0 bg-slate-50 text-[#C29B2C] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Clock size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#000F1D] text-lg mb-2 italic">운영 시간</h4>
                      <div className="text-slate-900 font-bold leading-relaxed text-sm">
                        <div className="flex justify-between gap-4 border-b border-slate-100 pb-1"><span>월, 화, 수, 금</span> <span>10:00 - 19:00</span></div>
                        <div className="flex justify-between gap-4 border-b border-slate-100 py-1"><span>목요일</span> <span>10:00 - 17:00</span></div>
                        <div className="flex justify-between gap-4 border-b border-slate-100 py-1"><span>토요일</span> <span>10:00 - 14:00</span></div>
                        <div className="flex justify-between gap-4 pt-1 text-red-600"><span>일요일</span> <span>정기휴무</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-[#000F1D] text-white rounded-3xl relative overflow-hidden shadow-2xl">
                  <p className="text-lg font-bold leading-relaxed relative z-10">
                    "매장 앞 <span className="text-[#D4AF37]">대형 주차 공간</span> 완비! <br /> 방문 전 전화 주시면 필요한 서류나 절차를 미리 안내해 드립니다."
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="aspect-square sm:aspect-[4/3] bg-slate-200 rounded-[40px] overflow-hidden shadow-2xl relative border-8 border-white">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3161.424458428589!2d126.6025!3d37.6975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca656789abcd!2z6rK96riw64-EIOq5gO2PrOyLnCDthrXKeOyneOydvSDtnaTsi6BybyAzMjAtOA!5e0!3m2!1sko!2skr!4v1714704000000!5m2!1sko!2skr"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Map"
                    className="grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#C29B2C] rounded-full flex items-center justify-center text-[#000F1D] font-black shadow-2xl rotate-12 group-hover:rotate-0 transition-transform">
                  <div className="text-center">
                    <span className="block text-4xl mb-1">P</span>
                    <span className="text-xs uppercase font-black tracking-widest">주차 가능</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-[#000F1D] text-white py-20 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-16 border-b border-white/5 pb-16 mb-16">
            <div className="max-w-md">
              <span className="text-3xl font-display font-black text-[#D4AF37] block mb-6 italic tracking-tighter">
                김포 제일하나의료기
              </span>
              <p className="text-slate-300 text-lg leading-relaxed mb-10 font-medium italic opacity-80">
                "어르신의 더 나은 일상을 디자인합니다." <br />
                함께하면 건강한 미래가 열립니다.
              </p>
              <div className="flex gap-4">
                {!user ? (
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="text-[12px] bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-white/50 hover:text-[#D4AF37] hover:bg-white/10 transition-all uppercase tracking-widest font-black flex items-center gap-2"
                  >
                    <LogIn size={14} /> 관리자 로그인
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-[#D4AF37] font-bold">관리자로 로그인됨</p>
                    <button 
                      onClick={handleLogout}
                      className="text-[12px] bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-widest font-black flex items-center gap-2"
                    >
                      <LogOut size={14} /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
              <div>
                <h4 className="text-[#D4AF37] font-black text-xl mb-6 italic border-b border-[#D4AF37]/20 pb-2 inline-block">고객지원</h4>
                <ul className="space-y-4 text-slate-300 text-base font-bold">
                  <li className="flex gap-3 items-center">대표번호: 031-989-7295</li>
                  <li className="flex gap-3 items-center">상담문의: 010-3637-7295</li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#D4AF37] font-black text-xl mb-6 italic border-b border-[#D4AF37]/20 pb-2 inline-block">매장 정보</h4>
                <ul className="space-y-4 text-slate-300 text-base font-bold">
                  <li className="text-sm">사업자등록번호: 137-20-93978</li>
                  <li className="text-sm">대표: 전대운</li>
                  <li className="text-sm bg-[#C29B2C]/10 text-[#D4AF37] px-3 py-1 rounded-lg inline-block">김포 페이 가맹점</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-white/30 uppercase tracking-[0.2em] font-black">
            <p>© 2024 KIMPO JEIL HANA MEDICAL. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      {/* 상품 상세 모달 */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-[40px] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="md:w-1/2 bg-slate-100 overflow-y-auto max-h-[40vh] md:max-h-full scrollbar-hide">
                <img src={selectedProduct.imageUrl} className="w-full aspect-[4/3] object-cover" />
                <div className="grid grid-cols-2 gap-1 p-1">
                  {selectedProduct.additionalImages?.map((img, i) => (
                    <img key={i} src={img} className="w-full aspect-square object-cover" />
                  ))}
                </div>
              </div>
              
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="self-end p-2 text-slate-400 hover:text-[#000F1D] mb-4"
                >
                  <X size={32} />
                </button>
                
                <span className="text-sm text-[#C29B2C] font-black tracking-widest mb-2">
                  {CATEGORIES[selectedProduct.category]?.title}
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-[#000F1D] mb-6 tracking-tighter">
                  {selectedProduct.name}
                </h2>
                
                <div className="flex-1 space-y-8">
                  <div>
                    <h4 className="text-lg font-black text-[#000F1D] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-[#C29B2C] rounded-full" />
                      제품 상세 정보
                    </h4>
                    <p className="text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedProduct.description || '상세 정보가 준비 중입니다. 매장으로 문의해 주시면 친절히 안내 도와드리겠습니다.'}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                    <p className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2">문의 안내</p>
                    <div className="flex items-center gap-4 text-slate-800 font-bold">
                      <Phone size={20} className="text-[#C29B2C]" />
                      031-989-7295
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-normal">
                      * 본 제품은 국가 지원 혜택(장기요양보험) 적용이 가능할 수 있습니다. <br />
                      등급 확인 및 구입/대여 절차는 전화로 문의 바랍니다.
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={() => {
                       window.location.href = "tel:031-989-7295";
                    }}
                    className="flex-1 bg-[#000F1D] text-[#D4AF37] py-4 rounded-2xl font-black shadow-xl hover:bg-[#001A33] transition-all"
                  >
                    전화 상담 문의
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 관리자 로그인 모달 */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#000F1D]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-12 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute top-8 right-8 text-slate-300 hover:text-[#000F1D] transition-all hover:rotate-90"
              >
                <X size={32} />
              </button>

              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-[#000F1D] text-[#D4AF37] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-navy-900/40">
                  <LogIn size={40} />
                </div>
                <h3 className="text-3xl font-display font-black text-[#000F1D] italic mb-2 tracking-tighter">관리자 로그인</h3>
                <p className="text-slate-500 font-bold">콘텐츠 관리 시스템</p>
              </div>

              <div className="space-y-6">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-100 py-4.5 rounded-2xl font-black text-slate-900 hover:bg-slate-50 hover:border-[#C29B2C] transition-all shadow-lg active:scale-95 px-6 group"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                  Google 계정으로 인증하기
                </button>
                
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  등록된 관리자 이메일 주소만 <br /> 접근이 허용됩니다.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
