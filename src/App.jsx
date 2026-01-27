import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

// --- Error Boundary (Crash Protection) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) {
    console.error("App Crash:", error);
    // Clear potentially corrupted translation cookies
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    localStorage.clear();
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4">
          <h3 className="text-danger">System Encountered an Error</h3>
          <button className="btn btn-dark rounded-pill px-4 mt-3" onClick={() => window.location.reload()}>Reload Application</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Constants & Data ---
const githubUser = 'LexSwordBD';
const repoName = 'BDKanoon';
const siteLink = window.location.origin;
const ADMIN_EMAIL = 'bdkanoon@gmail.com'; 

// Shortened list for brevity in this view, keep your full list in production
const lawAliases = {
  'Constitution of Bangladesh (সংবিধান)': ['Constitution', 'Article', 'Writ Petition', 'Fundamental Rights', 'সংবিধান'],
  'Code of Civil Procedure (CPC/দেওয়ানী)': ['CPC', 'Civil Procedure', 'Civil Revision', 'Civil Appeal', 'Order', 'Rule', 'দেওয়ানী'],
  'Code of Criminal Procedure (CrPC/ফৌজদারী)': ['CrPC', 'Criminal Procedure', '561A', '498', 'bail', 'ফৌজদারী'],
  'Penal Code (দণ্ডবিধি)': ['Penal Code', '302', '304', '395', '420', 'dondobidhi', 'দণ্ডবিধি'],
  'Evidence Act (সাক্ষ্য আইন)': ['Evidence Act', 'Confession', 'Burden of proof', 'সাক্ষ্য'],
  'Nari O Shishu Nirjatan (নারী ও শিশু)': ['Nari O Shishu', 'Women and Children', 'Rape', 'Trafficking', 'নারী ও শিশু'],
  'Artha Rin Adalat Ain (অর্থ ঋণ)': ['Artha Rin', 'Money Loan', 'Auction', 'অর্থ ঋণ'],
  'Negotiable Instruments Act (চেক ডিজঅনার)': ['Negotiable Instruments', '138', 'Dishonour', 'Cheque', 'চেক'],
  'Transfer of Property Act (সম্পত্তি হস্তান্তর)': ['Transfer of Property', 'TP Act', 'Mortgage', 'Lease', 'সম্পত্তি'],
  'Land Survey Tribunal (ভূমি জরিপ)': ['Land Survey', 'L.S.T', 'Record of Rights', 'Khatian', 'জরিপ']
};

const stopwords = ['a', 'an', 'the', 'of', 'in', 'and', 'or', 'is', 'are', 'to', 'for', 'with', 'on', 'at', 'by', 'from'];

// --- Helper: Highlight Text ---
const HighlightedText = ({ text, highlight, isExactMatch }) => {
  if (!text) return null;
  if (!highlight) return <span>{text}</span>;
  try {
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let regex;
    if (isExactMatch) {
      regex = new RegExp(`(${escapeRegExp(highlight.trim())})`, 'gi');
    } else {
      const words = highlight.split(/\s+/).filter(w => w.length > 0 && !stopwords.includes(w.toLowerCase())).map(escapeRegExp);
      if (words.length === 0) return <span>{text}</span>;
      regex = new RegExp(`(${words.join('|')})`, 'gi');
    }
    const parts = text.toString().split(regex);
    return (<span>{parts.map((part, i) => regex.test(part) ? <span key={i} className="highlight">{part}</span> : part)}</span>);
  } catch (e) { return <span>{text}</span>; }
};

// --- MAIN APPLICATION COMPONENT ---
function AppContent() {
  const [session, setSession] = useState(null);
  const [subStatus, setSubStatus] = useState(false);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Search
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLaw, setSelectedLaw] = useState('');
  const [isExactMatch, setIsExactMatch] = useState(false);
  
  // Advanced Search
  const [showAdvSearch, setShowAdvSearch] = useState(false);
  const [advFields, setAdvFields] = useState({ journal: '', vol: '', div: '', page: '' });

  // Reader View
  const [currentJudgment, setCurrentJudgment] = useState(null);
  const [judgmentText, setJudgmentText] = useState('');
  const [rawEnglishText, setRawEnglishText] = useState(''); // Keeps original text
  const [parallelCitations, setParallelCitations] = useState([]);
  const [isTranslated, setIsTranslated] = useState(false);

  // Auth & Admin
  const [modalMode, setModalMode] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalNotifications, setGlobalNotifications] = useState([]);
  
  // Forms
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  
  // Toast Notification
  const [notice, setNotice] = useState(null);
  const openNotice = (p) => setNotice(p);
  const closeNotice = () => setNotice(null);

  // --- 1. SMART LEGAL DICTIONARY IMPLEMENTATION ---
  // This function replaces English terms with correct Bengali Legal Terms
  // and wraps them in 'notranslate' spans so Google doesn't mess them up.
  const applyLegalTerminology = (text) => {
    if (!text) return "";
    let processed = text;

    // Dictionary format: [Regex, Bengali Term]
    // Regex uses word boundaries (\b) where appropriate to avoid partial matches
    const dictionary = [
      // --- High Priority Legal Concepts ---
      [/Rule Absolute/gi, "রুল অ্যাবসলিউট"],
      [/Rule Nisi/gi, "রুল নিশি"],
      [/Rule Discharged/gi, "রুল ডিসচার্জড (খারিজ)"],
      [/Leave to Appeal/gi, "লিভ টু আপীল"],
      [/Suo Moto/gi, "সুয়োমোটো (স্বতঃপ্রণোদিত)"],
      [/Status Quo/gi, "স্থিতাবস্থা (Status Quo)"],
      [/Ad-interim/gi, "অ্যাড-ইন্টেরিম (অন্তর্বর্তীকালীন)"],
      [/Amicus Curiae/gi, "অ্যামিকাস কিউরি"],
      [/Habeas Corpus/gi, "হেবিয়াস কর্পাস"],
      
      // --- Documents & Procedure ---
      [/\bPetition of Complaint\b/gi, "নালিশী দরখাস্ত"],
      [/\bComplaint petition\b/gi, "নালিশী দরখাস্ত"],
      [/\bComplaint\b/gi, "নালিশী দরখাস্ত"], // Overrides "অভিযোগ" for better legal context
      [/\bF\.?I\.?R\b/gi, "এজাহার (FIR)"],
      [/\bCharge Sheet\b/gi, "চার্জশিট (অভিযোগপত্র)"],
      [/\bAffidavit\b/gi, "হলফনামা"],
      [/\bVokalatnama\b/gi, "ওকালতনামা"],
      [/\bShow Cause\b/gi, "শোকজ (কারণ দর্শানো)"],
      [/\bPrayer\b/gi, "প্রার্থনা"],
      [/\bSubmissions?\b/gi, "সাবমিশন (বক্তব্য)"],
      [/\bSubmitted\b/gi, "নিবেদন করলেন"], // Better than 'দাখিল' for lawyers speaking
      
      // --- Court & Parties ---
      [/High Court Division/gi, "হাইকোর্ট বিভাগ"],
      [/Appellate Division/gi, "আপিল বিভাগ"],
      [/Supreme Court/gi, "সুপ্রীম কোর্ট"],
      [/Learned Advocate/gi, "বিজ্ঞ আইনজীবী"],
      [/Learned Judge/gi, "বিজ্ঞ বিচারক"],
      [/Attorney General/gi, "অ্যাটর্নি জেনারেল"],
      [/Petitioner/gi, "আবেদনকারী"],
      [/Opposite Party/gi, "বিবাদী পক্ষ"],
      [/Respondent/gi, "রেসপন্ডেন্ট"],
      
      // --- Outcomes ---
      [/Judgment/gi, "রায় (Judgment)"],
      [/Decree/gi, "ডিক্রি"],
      [/Dismissed/gi, "খারিজ (Dismissed)"],
      [/Allowed/gi, "মঞ্জুর (Allowed)"]
    ];

    dictionary.forEach(([regex, bnTerm]) => {
       // CRITICAL FIX: Adding spaces around the term " ${bnTerm} " to prevent sticking
       // Using <span class="notranslate"> prevents Google from re-translating it literally
       processed = processed.replace(regex, ` <span class="notranslate" style="color:#000; font-weight:500;">${bnTerm}</span> `);
    });

    return processed;
  };

  // --- 2. CSS & FONT INJECTION ---
  useEffect(() => {
    // Inject Google Translate Script
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,bn',
        autoDisplay: false,
        multilanguagePage: true, // Optimizes for mixed content
      }, 'google_translate_element');
    };

    // Inject Styles for Fonts and Layout Fixes
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hide Google Toolbar */
      .goog-te-banner-frame, .skiptranslate iframe { display: none !important; }
      body { top: 0 !important; }
      #google_translate_element { display: none !important; }

      /* --- FONT OPTIMIZATION FOR MOBILE --- */
      /* Load Noto Serif Bengali as a high-quality fallback from Google Fonts */
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600&display=swap');
      
      /* Define the font stack preferred by Lawyers */
      .legal-font {
          font-family: 'SolaimanLipi', 'Kalpurush', 'Nirmala UI', 'Noto Serif Bengali', serif !important;
      }

      /* Apply to Reader View when translated */
      .translated-mode .judgment-content, 
      .translated-mode .judgment-content * {
          font-family: 'SolaimanLipi', 'Kalpurush', 'Noto Serif Bengali', sans-serif !important;
          line-height: 2.2 !important; /* Spacious line height for mobile reading */
          font-size: 1.15rem !important;
          text-align: justify !important;
          color: #222;
          text-rendering: optimizeLegibility;
      }

      /* Paragraph Fix: Ensure paragraphs don't merge */
      .judgment-content p {
          display: block !important;
          margin-bottom: 1.5rem !important;
      }
      
      /* Fix Highlight Spacing */
      .notranslate {
          padding-left: 3px;
          padding-right: 3px;
          display: inline-block;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // --- Toggle Translation Logic ---
  const toggleLanguage = () => {
    const select = document.querySelector('.goog-te-combo');
    if (!select) {
        openNotice({ type: 'warning', title: 'System', message: 'Translation engine loading...' });
        return;
    }

    if (isTranslated) {
      // Revert to English
      select.value = 'en'; 
      select.dispatchEvent(new Event('change'));
      setJudgmentText(rawEnglishText); // Restore original English formatting
      setIsTranslated(false);
    } else {
      // Apply Bangla
      // 1. First apply our Smart Dictionary to the English text
      const preProcessed = applyLegalTerminology(rawEnglishText);
      setJudgmentText(preProcessed);
      
      // 2. Then trigger Google Translate for the connecting words
      // We wait 100ms to let React render the spans first
      setTimeout(() => {
          select.value = 'bn';
          select.dispatchEvent(new Event('change'));
          setIsTranslated(true);
      }, 100);
    }
  };

  // --- Session & PWA Performance Optimization ---
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      setLoading(true);
      // Fast PWA Load: Reduce delay to 100ms
      setTimeout(() => { if (isMounted) setLoading(false); }, 100);

      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(data?.session);
          if (data?.session?.user?.email === ADMIN_EMAIL) setIsAdmin(true);
          if (data?.session) checkSubscription(data.session.user);
        }
      } catch (e) { console.error(e); }
    };
    initSession();
    
    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if(isMounted) {
            setSession(session);
            if (session?.user?.email === ADMIN_EMAIL) setIsAdmin(true); else setIsAdmin(false);
            if(session) checkSubscription(session.user);
        }
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, []);

  // --- Helper Functions ---
  const checkSubscription = async (user) => {
      // Simple mock for brevity - replace with your full logic
      if(!user) return;
      const { data } = await supabase.from('members').select('*').eq('id', user.id).maybeSingle();
      if(data) {
          const isPrem = data.expiry_date ? new Date(data.expiry_date) > new Date() : false;
          setSubStatus(isPrem);
          setProfileData({...data, isPremium: isPrem});
      }
  };

  const loadJudgment = async (item) => {
    if (item.is_premium && !subStatus) { setModalMode('warning'); return; }
    setLoading(true); setView('reader'); setCurrentJudgment(item); setParallelCitations([]);
    
    // Reset translation UI
    if (isTranslated) {
        const select = document.querySelector('.goog-te-combo');
        if(select) { select.value = 'en'; select.dispatchEvent(new Event('change')); }
        setIsTranslated(false);
    }

    try {
      const url = `https://raw.githubusercontent.com/${githubUser}/${repoName}/main/judgments/${item.github_filename}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network Error");
      const fullText = await res.text();
      
      // Parse Logic
      const anchorStr = `===${item.case_anchor}===`;
      const anchorIdx = fullText.indexOf(anchorStr);
      let content = fullText;
      
      if (anchorIdx !== -1) {
          const endMarker = "===End===";
          const endIdx = fullText.indexOf(endMarker, anchorIdx);
          const prevEnd = fullText.lastIndexOf(endMarker, anchorIdx);
          let start = prevEnd !== -1 ? prevEnd + endMarker.length : 0;
          content = fullText.substring(start, endIdx !== -1 ? endIdx : fullText.length).trim();
      }
      
      // Cleanup headers
      content = content.replace(/===(.*?)===/g, "");
      
      setRawEnglishText(content); // Store original
      setJudgmentText(content);   // Display original initially
      
    } catch (e) {
      setJudgmentText("Error loading judgment text.");
      openNotice({ type: 'error', title: 'Error', message: 'Could not fetch data.' });
    } finally { setLoading(false); }
  };

  const handleSearch = async (page = 1) => {
      // Basic Search Logic (Shortened for brevity)
      setLoading(true); setView('results'); setCurrentPage(page);
      if(isTranslated) toggleLanguage(); // Reset language
      
      try {
          // Mock search for this snippet - use your full logic here
          let query = supabase.from('cases').select('*', { count: 'exact' });
          if(searchTerm) query = query.ilike('headnote', `%${searchTerm}%`);
          const { data, count } = await query.range((page-1)*20, page*20-1);
          setResults(data || []);
          setTotalCount(count || 0);
      } catch(e) {} finally { setLoading(false); }
  };

  const handleInstallClick = () => {
      if(deferredPrompt) { deferredPrompt.prompt(); setDeferredPrompt(null); }
      else setModalMode('app');
  };

  // --- Render ---
  return (
    <div>
      <div id="google_translate_element"></div>

      {/* Navbar - Kept notranslate to protect UI */}
      <nav className="navbar navbar-expand-lg fixed-top notranslate bg-white shadow-sm" style={{ transition: 'transform 0.3s', transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)' }}>
        <div className="container">
          <a className="navbar-brand fw-bold" href="#" onClick={()=>window.location.reload()}>BD<span className="text-primary">Kanoon</span></a>
          <div className="d-flex align-items-center">
             <button className="btn btn-dark btn-sm rounded-pill ms-auto" onClick={handleInstallClick}>
               <i className="fab fa-android me-1"></i> App
             </button>
             {session ? (
                 <button className="btn btn-outline-secondary btn-sm rounded-pill ms-2" onClick={()=>setModalMode('profile')}>Account</button>
             ) : (
                 <button className="btn btn-primary btn-sm rounded-pill ms-2" onClick={()=>setModalMode('login')}>Login</button>
             )}
          </div>
        </div>
      </nav>

      <div className="container" style={{ marginTop: '80px', minHeight: '80vh' }}>
        
        {/* --- VIEW: HOME --- */}
        {view === 'home' && (
            <div className="text-center py-5 notranslate">
                <h2 className="mb-3 fw-bold" style={{fontFamily: 'Playfair Display'}}>Legal Research. Simplified.</h2>
                <div className="card border-0 shadow-sm p-2 mx-auto" style={{maxWidth:'600px'}}>
                    <div className="input-group">
                        <input type="text" className="form-control border-0" placeholder="Search judgments..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleSearch(1)}/>
                        <button className="btn btn-primary rounded-end" onClick={()=>handleSearch(1)}>Search</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- VIEW: RESULTS --- */}
        {view === 'results' && !loading && (
             <div className="notranslate">
                 <p className="text-muted small">Found {totalCount} judgments</p>
                 {results.map(item => (
                     <div key={item.id} className="card mb-3 border-0 shadow-sm p-3" onClick={()=>loadJudgment(item)} style={{cursor:'pointer'}}>
                         <h6 className="fw-bold text-primary mb-1">{item.title}</h6>
                         <div className="small text-muted">{item.citation}</div>
                     </div>
                 ))}
             </div>
        )}

        {/* --- VIEW: READER (With Smart Translation) --- */}
        {view === 'reader' && !loading && currentJudgment && (
          <div id="readerView" className={`bg-white p-4 p-md-5 rounded-3 shadow-sm border mb-5 ${isTranslated ? 'translated-mode' : ''}`}>
            
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
              <button className="btn btn-outline-secondary btn-sm notranslate" onClick={()=>{if(isTranslated) toggleLanguage(); setView('results');}}><i className="fas fa-arrow-left"></i> Back</button>
              
              <div className="d-flex gap-2">
                <button 
                  className={`btn btn-sm ${isTranslated ? 'btn-outline-dark' : 'btn-dark'} rounded-pill px-3 shadow-sm fw-bold notranslate`} 
                  onClick={toggleLanguage}
                  style={{ minWidth: '130px' }}
                >
                  <i className={`fas ${isTranslated ? 'fa-undo' : 'fa-language'} me-2`}></i>
                  {isTranslated ? 'Original' : 'বাংলায় পড়ুন'}
                </button>
                <button className="btn btn-sm btn-outline-dark rounded-pill px-3 notranslate" onClick={() => window.print()}><i className="fas fa-print"></i></button>
              </div>
            </div>

            <h3 className="fw-bold text-center text-primary mb-2 notranslate" style={{ fontFamily: 'Playfair Display' }}>{currentJudgment.title}</h3>
            <p className="text-center text-dark fw-bold mb-4 notranslate">{currentJudgment.citation}</p>
            
            {isTranslated && (
                <div className="alert alert-info py-2 small text-center mb-4 border-0 bg-light-info text-primary notranslate">
                    <i className="fas fa-robot me-2"></i>
                    স্মার্ট লিগ্যাল ট্রান্সলেশন অন করা হয়েছে। আইনি পরিভাষাগুলো অপরিবর্তিত রাখা হয়েছে।
                </div>
            )}

            {/* CONTENT RENDERING */}
            {/* The fontFamily style here forces the correct font for Bengali when translated */}
            <div 
                className="mt-4 judgment-content" 
                style={{ 
                    whiteSpace: 'pre-wrap', 
                    textAlign: 'justify', 
                    fontFamily: isTranslated ? "'SolaimanLipi', 'Kalpurush', 'Noto Serif Bengali', serif" : "'Merriweather', serif"
                }} 
                dangerouslySetInnerHTML={{ __html: judgmentText }} 
            />
            
            <div className="mt-5 p-3 border-top text-muted small text-center notranslate">
                Disclaimer: {disclaimerText}
            </div>

          </div>
        )}

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}
      </div>
      
      {/* Toast Notification */}
      {notice && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 p-3 rounded bg-dark text-white shadow" style={{zIndex:3000, maxWidth:'90%'}}>
           <div className="d-flex align-items-center gap-3">
               <i className={`fas ${notice.type==='error'?'fa-times-circle text-danger':notice.type==='success'?'fa-check-circle text-success':'fa-info-circle text-info'}`}></i>
               <div>
                   <div className="fw-bold">{notice.title}</div>
                   <div className="small">{notice.message}</div>
               </div>
               <button className="btn btn-sm btn-link text-white" onClick={closeNotice}>OK</button>
           </div>
        </div>
      )}

      {/* Modals placeholders - keeping code concise as requested */}
      {modalMode === 'login' && (
         <div className="modal d-block" style={{background:'rgba(0,0,0,0.5)'}}>
             <div className="modal-dialog modal-dialog-centered">
                 <div className="modal-content p-4">
                     <h5 className="mb-3">Login</h5>
                     <button className="btn btn-dark w-100" onClick={()=>setModalMode(null)}>Close (Demo)</button>
                 </div>
             </div>
         </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
