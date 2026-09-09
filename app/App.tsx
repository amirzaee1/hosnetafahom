
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PAGES } from './content';
import { PageContent } from './types';
import { generateConceptualImage } from './geminiService';

const Illustration: React.FC<{ page: PageContent }> = ({ page }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Specifically for page 1, we use the image provided by the user
    if (page.id === 1) {
      // Direct reference to the uploaded asset (represented here by a descriptive placeholder matching the input)
      setImageUrl("https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    
    const fetchImage = async () => {
      const prompt = `Narrative model: ${page.narrativeModel}. Scenario: ${page.text.substring(0, 100)}. 
      Focus on human interaction, hands, and spatial distance. No text. 2D flat vector style.`;
      
      const url = await generateConceptualImage(prompt);
      if (isMounted) {
        setImageUrl(url);
        setLoading(false);
      }
    };

    fetchImage();
    return () => { isMounted = false; };
  }, [page.id]);

  return (
    <div className="w-full aspect-video md:aspect-square relative rounded-[32px] overflow-hidden bg-[#111827] flex items-center justify-center border border-white/5 mb-8 shadow-2xl shadow-black/50 animate-zoom-in">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-light tracking-widest">تولید محتوای بصری...</span>
        </div>
      ) : imageUrl ? (
        <img src={imageUrl} alt="Welcome Illustration" className="w-full h-full object-cover" />
      ) : (
        <div className="text-gray-600 text-sm">تصویر یافت نشد</div>
      )}
    </div>
  );
};

const TextCard: React.FC<{ page: PageContent; sentinelRef: React.RefObject<HTMLDivElement | null> }> = ({ page, sentinelRef }) => {
  const formattedContent = useMemo(() => {
    let result = page.text;
    const paragraphs = result.split('. ').map(p => p.trim()).filter(p => p.length > 0);
    
    return paragraphs.map((p, idx) => {
      let isHighlighted = page.highlights.some(h => p.includes(h));
      let isBold = page.primarySentences.some(b => p.includes(b));
      
      let textColor = "text-[#E5E7EB]";
      if (isHighlighted) {
        textColor = idx % 2 === 0 ? "text-[#22D3EE]" : "text-[#A78BFA]";
      }

      return (
        <React.Fragment key={idx}>
          <p className={`text-[17px] leading-[2.2] mb-6 ${textColor} ${isBold ? 'font-bold' : 'font-normal'}`}>
            {p}.
          </p>
          {(idx + 1) % 3 === 0 && idx !== paragraphs.length - 1 && (
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-8 mx-auto"></div>
          )}
        </React.Fragment>
      );
    });
  }, [page]);

  return (
    <div className="glass-card rounded-[32px] p-8 mb-36 shadow-2xl border border-white/10 animate-slide-up">
      {page.id === 1 && (
        <div className="mb-8">
            <span className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 block opacity-70">آغاز مسیر تحول</span>
            <h1 className="text-[28px] font-black text-white leading-tight">
            {page.title}
            </h1>
            <div className="w-16 h-[3px] bg-gradient-to-r from-cyan-400 to-purple-600 mt-5 rounded-full"></div>
        </div>
      )}
      <div className="flex flex-col relative">
        {formattedContent}
        <div ref={sentinelRef} className="h-10 w-full" />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const currentPage = PAGES[currentPageIndex];
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for scroll-to-unlock button
  useEffect(() => {
    setCanProceed(false); 
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCanProceed(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px 50px 0px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [currentPageIndex]);

  const handleNext = () => {
    if (currentPageIndex < PAGES.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getButtonText = () => {
    if (currentPageIndex === 0) return "شروع یادگیری";
    if (currentPageIndex === PAGES.length - 1) return "اتمام و خروج";
    return "ادامه آموزش";
  };

  return (
    <div key={currentPageIndex} className="min-h-screen max-w-[430px] mx-auto bg-[#0F172A] relative flex flex-col p-[20px] pb-32">
      
      {/* Narrative Illustration */}
      <Illustration page={currentPage} />

      {/* Main Content */}
      <TextCard page={currentPage} sentinelRef={sentinelRef} />

      {/* Navigation - Unlocks after scroll */}
      <div className={`fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent transition-all duration-700 ${canProceed ? 'animate-bounce-in opacity-100 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="flex gap-4">
          <button 
            onClick={handlePrev}
            disabled={currentPageIndex === 0}
            className={`flex-1 h-[60px] rounded-[22px] bg-white/5 border border-white/10 text-white font-medium backdrop-blur-md transition-all active:scale-90 ${currentPageIndex === 0 ? 'invisible' : 'visible'}`}
          >
            صفحه قبل
          </button>
          
          <button 
            onClick={handleNext}
            className="flex-[2.5] h-[60px] rounded-[22px] bg-gradient-to-r from-[#22D3EE] via-[#4F46E5] to-[#8B5CF6] text-white font-black text-[18px] shadow-2xl shadow-cyan-500/30 active:scale-[0.96] transition-all flex items-center justify-center gap-3"
          >
            {getButtonText()}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
