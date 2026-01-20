import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

// --- Constants & Data ---
const githubUser = 'LexSwordBD';
const repoName = 'BDKanoon';
const siteLink = window.location.origin; 

const lawAliases = {
    'Constitution of Bangladesh (সংবিধান)': ['Constitution', 'Konstitution', 'Art.', 'Article', 'সংবিধান'],
    'Code of Civil Procedure (CPC/দেওয়ানী)': ['CPC', 'Code of Civil Procedure', 'Civil Procedure', 'C.P.C', 'দেওয়ানী', 'Order', 'Rule'],
    'Code of Criminal Procedure (CrPC/ফৌজদারী)': ['CrPC', 'Code of Criminal Procedure', 'Criminal Procedure', 'Cr.P.C', 'ফৌজদারী', '561A', '498', 's. 144'],
    'Penal Code (দণ্ডবিধি)': ['Penal', 'PC', 'P.C', 'dondobidhi', 'দণ্ডবিধি', '302', '304', '1860', 'Penal Code'],
    'Evidence Act (সাক্ষ্য আইন)': ['Evidence', 'sakkho', 'sakhho', 'সাক্ষ্য'],
    'Limitation Act (তামাদি আইন)': ['Limitation', 'Section 5', 'condonation', 'তামাদি'],
    'Specific Relief Act (সুনির্দিষ্ট প্রতিকার)': ['Specific Relief', 'SR Act', 'S.R. Act', 'সুনির্দিষ্ট প্রতিকার'],
    'Nari O Shishu Nirjatan Daman Ain (নারী ও শিশু)': ['Nari O Shishu', 'Women and Children', 'Nari-O-Shishu', 'নারী ও শিশু', 'নারী শিশু', 'Shishu'],
    'Artha Rin Adalat Ain (অর্থ ঋণ আদালত)': ['Artha Rin', 'Money Loan', 'Adalat', 'অর্থ ঋণ'],
    'Digital Security Act (ডিজিটাল নিরাপত্তা)': ['Digital Security', 'Cyber', 'ICT Act', 'ডিজিটাল নিরাপত্তা'],
    'Narcotics Control Act (মাদক দ্রব্য নিয়ন্ত্রণ)': ['Narcotics', 'Madok', 'Drug', 'Table', 'Yaba', 'Heroin', 'Phensedyl', 'মাদক'],
    'Special Powers Act (বিশেষ ক্ষমতা)': ['Special Powers', 'SPA', 'Special Power', 'বিশেষ ক্ষমতা'],
    'Anti-Terrorism Act (সন্ত্রাস বিরোধী)': ['Anti-Terrorism', 'Terrorism', 'সন্ত্রাস'],
    'Arms Act (অস্ত্র আইন)': ['Arms Act', 'অস্ত্র'],
    'Ain Srinkhola Bighnokari (দ্রুত বিচার)': ['Druto Bichar', 'Speedy Trial', 'দ্রুত বিচার'],
    'Mobile Court Act (মোবাইল কোর্ট)': ['Mobile Court', 'মোবাইল কোর্ট'],
    'Transfer of Property Act (সম্পত্তি হস্তান্তর)': ['Transfer of Property', 'TP Act', 'T.P. Act', 'সম্পত্তি হস্তান্তর'],
    'Contract Act (চুক্তি আইন)': ['Contract Act', 'Agreement', 'চুক্তি'],
    'Registration Act (রেজিস্ট্রেশন)': ['Registration', 'Section 17', 'রেজিস্ট্রেশন'],
    'State Acquisition & Tenancy Act (প্রজাস্বত্ব)': ['State Acquisition', 'SAT Act', 'Tenancy', 'প্রজাস্বত্ব'],
    'Vested Property Return Act (অর্পিত সম্পত্তি)': ['Vested Property', 'Enemy Property', 'অর্পিত', 'Vested'],
    'Trust Act (ট্রাস্ট আইন)': ['Trust Act', 'Trustee'],
    'Muslim Family Laws (মুসলিম পারিবারিক আইন)': ['Muslim Family', 'MFLO', 'Denmohar', 'Dower', 'Talaq'],
    'Family Courts Ordinance (পারিবারিক আদালত)': ['Family Courts', 'Family Court', 'পারিবারিক'],
    'Guardians and Wards Act (অভিভাবক ও প্রতিপাল্য)': ['Guardians and Wards', 'Guardian', 'Custody', 'অভিভাবক'],
    'Negotiable Instruments Act (NI Act/চেক ডিজঅনার)': ['Negotiable Instruments', 'NI Act', 'N.I. Act', '138', 'Cheque', 'Dishonour', 'চেক'],
    'Bangladesh Labor Act (শ্রম আইন)': ['Labor Act', 'Labour', 'Employment', 'Worker', 'শ্রম'],
    'Companies Act (কোম্পানি আইন)': ['Companies Act', 'Company Law', 'Winding up', 'কোম্পানি'],
    'VAT Act (ভ্যাট আইন)': ['Value Added Tax', 'VAT', 'ভ্যাট', 'Musok'],
    'Income Tax Ordinance (আয়কর)': ['Income Tax', 'Tax', 'Taxes', 'আয়কর'],
    'Customs Act (কাস্টমস)': ['Customs', 'Custom'],
    'Right to Information Act (তথ্য অধিকার)': ['Right to Information', 'RTI', 'তথ্য অধিকার']
};

const stopwords = ['a', 'an', 'the', 'of', 'in', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'shall', 'will', 'am'];

const HighlightedText = ({ text, highlight }) => {
    if (!text) return null;
    if (!highlight) return <span>{text}</span>;

    try {
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const words = highlight.split(/\s+/).filter(w => w.length > 0).map(escapeRegExp);
        if (words.length === 0) return <span>{text}</span>;
        const regex = new RegExp(`(${words.join('|')})`, 'gi');
        const parts = text.toString().split(regex);
        return (
            <span>
                {parts.map((part, i) => 
                    regex.test(part) ? <span key={i} className="highlight">{part}</span> : part
                )}
            </span>
        );
    } catch (e) {
        return <span>{text}</span>;
    }
};

export default function App() {
  const [session, setSession] = useState(null);
  const [subStatus, setSubStatus] = useState(false);
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(true);
  
  // Search States
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLaw, setSelectedLaw] = useState('');
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [showAdvSearch, setShowAdvSearch] = useState(false);
  const [advFields, setAdvFields] = useState({journal: '', vol: '', div: '', page: ''});
  
  // Reader State
  const [currentJudgment, setCurrentJudgment] = useState(null);
  const [judgmentText, setJudgmentText] = useState('');
  const [parallelCitations, setParallelCitations] = useState([]);

  // Modals Control
  const [modalMode, setModalMode] = useState(null); 
  const [profileData, setProfileData] = useState(null);

  // Ref to track interval
  const sessionIntervalRef = useRef(null);

  // --- HELPER: Update Session in DB ---
  const updateSessionInDB = async (currentSession) => {
      if (!currentSession?.user?.email) return;
      try {
          await supabase.from('members')
              .update({ current_session_id: currentSession.access_token })
              .eq('email', currentSession.user.email);
      } catch (err) { console.error("Session sync failed", err); }
  };

  // --- HELPER: Check Subscription ---
  const checkSubscription = async (email) => {
    try {
        const { data, error } = await supabase.from('members').select('*').eq('email', email).single();
        if(data) {
            const expDate = new Date(data.expiry_date);
            const today = new Date();
            // Fix invalid date issue
            if (isNaN(expDate.getTime())) {
                setSubStatus(false);
                setProfileData({ ...data, isPremium: false, diffDays: 0, expDate: 'Invalid Date' });
                return;
            }
            const diffTime = expDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            const isPremium = diffDays >= 0; // Fixed logic
            
            setSubStatus(isPremium);
            setProfileData({ ...data, isPremium, diffDays: diffDays > 0 ? diffDays : 0, expDate: expDate.toDateString() });
        } else {
            setSubStatus(false);
            setProfileData({ email, isPremium: false, diffDays: 0, expDate: 'N/A' });
        }
    } catch(e) {
        setSubStatus(false);
        setProfileData({ email, isPremium: false, diffDays: 0, expDate: 'N/A' });
    }
  };

  // --- HELPER: Start Monitor ---
  const startMonitor = (currentSession) => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      
      sessionIntervalRef.current = setInterval(async () => {
          if (!currentSession?.user?.email) return;

          const { data, error } = await supabase
              .from('members')
              .select('current_session_id')
              .eq('email', currentSession.user.email)
              .maybeSingle();
          
          if (!error && data) {
              // Only logout if session ID exists in DB and is different
              if (data.current_session_id && data.current_session_id !== currentSession.access_token) {
                  clearInterval(sessionIntervalRef.current);
                  await supabase.auth.signOut(); 
                  setSession(null);
                  setSubStatus(false);
                  setModalMode('sessionError');
              }
          }
      }, 10000); // Increased interval to reduce load
  };

  // --- MAIN INITIALIZATION EFFECT ---
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
        setLoading(true);
        try {
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            
            if (initialSession && mounted) {
                setSession(initialSession);
                // Execute checks in parallel but handle errors gracefully
                await Promise.allSettled([
                    updateSessionInDB(initialSession),
                    checkSubscription(initialSession.user.email)
                ]);
                startMonitor(initialSession);
            }
        } catch (error) {
            console.error("Init Error:", error);
        } finally {
            if (mounted) setLoading(false);
        }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setSession(currentSession);
            await updateSessionInDB(currentSession);
            await checkSubscription(currentSession.user.email);
            startMonitor(currentSession);
        } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setSubStatus(false);
            setProfileData(null);
            if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
        if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    };
  }, []);

  // --- Search Functions ---
  const handleSearch = async (page = 1, type = 'simple') => {
    setLoading(true);
    setCurrentPage(page);
    setView('results'); 

    try {
        let queryBuilder = supabase.from('cases').select('*', { count: 'exact' });

        if (type === 'advanced') {
            const { journal, vol, div, page: pg } = advFields;
            if (!journal || !vol || !div || !pg) { alert("Fill all fields."); setLoading(false); return; }
            queryBuilder = queryBuilder.eq('journal', journal).eq('volume', vol).eq('division', div).eq('page_number', pg);
        } else {
            // --- LAW FILTER ---
            let aliasCondition = "";
            if(selectedLaw) {
               const aliases = lawAliases[selectedLaw] || [selectedLaw];
               const headnoteChecks = aliases.map(a => `headnote.ilike.%${a}%`).join(',');
               const titleChecks = aliases.map(a => `title.ilike.%${a}%`).join(',');
               aliasCondition = headnoteChecks + ',' + titleChecks;
            }

            // Sanitize Search Term
            const safeSearchTerm = searchTerm.replace(/[^\w\s\u0980-\u09FF]/g, ''); // Remove special chars causing crash

            if (isExactMatch) {
               const queryStr = `headnote.ilike.%${safeSearchTerm}%,title.ilike.%${safeSearchTerm}%`;
               if(aliasCondition) queryBuilder = queryBuilder.or(aliasCondition + ',' + queryStr);
               else queryBuilder = queryBuilder.or(queryStr);
            } else {
               const words = safeSearchTerm.split(/\s+/).filter(w => !stopwords.includes(w.toLowerCase()) && w.length > 1);
               let textCondition = "";
               
               if (words.length > 0) {
                   textCondition = words.map(w => `headnote.ilike.%${w}%,title.ilike.%${w}%`).join(',');
               }
               
               if (textCondition === "" && !aliasCondition) {
                   setLoading(false);
                   setResults([]);
                   setTotalCount(0);
                   return; 
               }

               if(aliasCondition && textCondition) queryBuilder = queryBuilder.or(aliasCondition + ',' + textCondition);
               else if (aliasCondition) queryBuilder = queryBuilder.or(aliasCondition);
               else if (textCondition) queryBuilder = queryBuilder.or(textCondition);
            }
        }

        const itemsPerPage = 20;
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        
        if (type === 'advanced' && (!session || !subStatus)) {
            const { count } = await queryBuilder.range(0, 1).order('page_number', { ascending: true });
            if (count > 0) { setModalMode('gate'); setLoading(false); return; }
        }

        const { data, error, count } = await queryBuilder.range(from, to).order('page_number', { ascending: true });
        
        if(data) {
            setResults(data);
            setTotalCount(count || 0);
        } else if (error) {
            console.error("Search Error:", error);
        }
    } catch (e) {
        console.error("Search Exception:", e);
    } finally {
        setLoading(false); // Ensures loading stops even if error occurs
    }
  };

  // --- LOAD JUDGMENT LOGIC ---
  const loadJudgment = async (item) => {
    if(item.is_premium && !session) { setModalMode('warning'); return; }
    if(item.is_premium && !subStatus) { setModalMode('warning'); return; }

    setLoading(true);
    setView('reader');
    setCurrentJudgment(item);
    setParallelCitations([]); 

    try {
        const url = `https://raw.githubusercontent.com/${githubUser}/${repoName}/main/judgments/${item.github_filename}`;
        const res = await fetch(url);
        if(!res.ok) throw new Error("File not found");
        
        const fullText = await res.text();
        
        const anchorStr = `===${item.case_anchor}===`;
        const anchorIdx = fullText.indexOf(anchorStr);
        
        if (anchorIdx === -1) {
            throw new Error("Case anchor not found in file.");
        }

        const endMarker = "===End===";
        const endIdx = fullText.indexOf(endMarker, anchorIdx); 

        if (endIdx === -1) {
             throw new Error("End marker not found for this case.");
        }

        const previousEndIdx = fullText.lastIndexOf(endMarker, anchorIdx);
        let blockStart = 0;
        if (previousEndIdx !== -1) {
            blockStart = previousEndIdx + endMarker.length;
        }

        let caseContent = fullText.substring(blockStart, endIdx).trim();

        const matches = [];
        while (true) {
            const headerRegex = /^\s*(===(.*?)===)/;
            const match = headerRegex.exec(caseContent);

            if (match) {
                const citeText = match[2].trim();
                if (!matches.includes(citeText)) {
                    matches.push(citeText);
                }
                caseContent = caseContent.replace(match[1], '').trimStart();
            } else {
                break;
            }
        }

        setParallelCitations(matches); 
        setJudgmentText(caseContent); 

    } catch(e) {
        setJudgmentText("Error loading judgment text: " + e.message);
        setParallelCitations([]);
    } finally {
        setLoading(false);
    }
  };

  const handleAuth = async (email, password, isSignUp) => {
      setLoading(true);
      if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({ email: email, password: password });
          if (error) alert(error.message);
          else alert("Account created successfully! You are now logged in.");
      } else {
          const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
          if (error) alert(error.message);
      }
      setLoading(false);
      setModalMode(null);
  };

  const handlePasswordReset = async (email) => {
      if (!email) return alert("Please enter your email first in the box.");
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: siteLink });
      if (error) alert(error.message);
      else alert("Password reset link sent to your email!");
      setLoading(false);
  };

  const handleUpdatePassword = async (newPassword) => {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) alert("Error: " + error.message);
      else {
          alert("Password updated successfully!");
          setModalMode(null);
          window.location.hash = ''; 
      }
      setLoading(false);
  };

  const handleLogout = async () => {
      setSession(null); // Clear session locally immediately
      setSubStatus(false);
      await supabase.auth.signOut();
      window.location.reload();
  };

  const toggleBookmark = async (item) => {
      if(!session) { setModalMode('login'); return; }
      const { error } = await supabase.from('bookmarks').insert([{ 
          email: session.user.email, case_title: item.title, case_citation: item.citation, 
          case_anchor: item.case_anchor, github_filename: item.github_filename 
      }]);
      if(error) alert("Already saved or error."); else alert("Saved!");
  };

  const fetchBookmarks = async () => {
      if(!session) { setModalMode('login'); return; }
      setLoading(true);
      const { data } = await supabase.from('bookmarks').select('*').eq('email', session.user.email);
      setLoading(false);
      if(data) {
          setResults(data.map(b => ({
              id: b.id, title: b.case_title, citation: b.case_citation, 
              case_anchor: b.case_anchor, github_filename: b.github_filename, 
              is_premium: true, headnote: "Saved Bookmark"
          })));
          setView('results');
          setTotalCount(data.length);
          document.getElementById('homeSection')?.classList.add('hero-shrunk');
      }
  };

  const handlePaymentSubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = new FormData(form);
      
      setLoading(true);
      try {
          const response = await fetch("https://formspree.io/f/xgookqen", {
              method: "POST",
              body: data,
              headers: {
                  'Accept': 'application/json'
              }
          });
          
          if (response.ok) {
              setModalMode('paymentSuccess');
              form.reset();
          } else {
              alert("There was a problem submitting your form.");
          }
      } catch (error) {
          alert("Error sending form.");
      } finally {
          setLoading(false);
      }
  };

  // ================= RENDER =================
  const displayCitations = currentJudgment && parallelCitations.length > 0 
      ? parallelCitations.filter(c => c !== currentJudgment.case_anchor && c !== currentJudgment.citation)
      : [];

  // FULL SCREEN LOADING STATE FOR INITIAL SYNC
  if (loading && !session && view === 'home') {
      return (
          <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
              <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
              </div>
          </div>
      );
  }

  return (
    <div>
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg fixed-top">
            <div className="container">
                <a className="navbar-brand" href="#" onClick={()=>window.location.reload()}>BD<span>Kanoon</span></a>
                <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <i className="fas fa-bars"></i>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center">
                        <li className="nav-item"><a className="nav-link nav-link-close" href="#" onClick={()=>{setView('home'); setResults([]);}}>Home</a></li>
                        <li className="nav-item"><a className="nav-link nav-link-close" href="#" onClick={fetchBookmarks}>Bookmarks</a></li>
                        <li className="nav-item"><a className="nav-link nav-link-close" href="#packages">Pricing</a></li>
                        <li className="nav-item">
                            <button className="btn-app ms-lg-3 mt-3 mt-lg-0 border-0" onClick={()=>setModalMode('app')}>
                                <i className="fab fa-android"></i> Get App
                            </button>
                        </li>
                        <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
                            {session ? (
                                <button className="btn btn-outline-dark rounded-pill px-3 btn-sm" onClick={()=>setModalMode('profile')}>
                                    <i className="fas fa-user-circle"></i> Account
                                </button>
                            ) : (
                                <button className="btn btn-dark rounded-pill px-4 btn-sm" onClick={()=>setModalMode('login')}>
                                    Login
                                </button>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

        {/* Hero Section */}
        <div className={`hero-section ${view !== 'home' ? 'hero-shrunk' : ''}`} id="homeSection">
            <div className="hero-content">
                {view === 'home' && (
                    <>
                        <h1 className="hero-title">Intelligent Legal Research.</h1>
                        <p className="hero-subtitle">Search over 50,000+ judgments from the Supreme Court of Bangladesh.</p>
                    </>
                )}
                
                <div className="search-container">
                    <div className="search-container-box">
                        <div className="law-select-wrapper">
                            <input className="law-input" list="lawList" placeholder="Select Law..." onChange={(e)=>setSelectedLaw(e.target.value)}/>
                            <datalist id="lawList">
                                {Object.keys(lawAliases).map(law => <option key={law} value={law}/>)}
                            </datalist>
                        </div>
                        <input 
                            type="text" className="main-input" 
                            placeholder="Search keywords..." 
                            value={searchTerm}
                            maxLength={50}
                            onChange={(e)=>setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                        />
                        <button className="btn btn-link text-secondary" onClick={()=>setShowAdvSearch(!showAdvSearch)}><i className="fas fa-sliders-h"></i></button>
                        <button className="btn-search-hero" onClick={()=>handleSearch(1)}><i className="fas fa-arrow-right"></i></button>
                    </div>
                    
                    <div className="d-flex justify-content-center gap-3 mt-3">
                        <label className="small text-secondary d-flex align-items-center gap-2" style={{cursor:'pointer'}}>
                            <input type="checkbox" onChange={(e)=>setIsExactMatch(e.target.checked)}/> Exact Phrase Match
                        </label>
                    </div>

                    {showAdvSearch && (
                        <div className="adv-search-panel" style={{display:'block'}}>
                            <h6 className="small fw-bold text-uppercase text-secondary mb-3">Citation Search</h6>
                            <div className="row g-2">
                                <div className="col-6 col-md-3"><select className="form-select form-select-sm" onChange={e=>setAdvFields({...advFields, journal: e.target.value})}><option value="">Journal</option><option>DLR</option><option>BLD</option><option>ADC</option><option>MLR</option><option>BLC</option></select></div>
                                <div className="col-6 col-md-2"><input type="text" className="form-control form-control-sm" placeholder="Vol" onChange={e=>setAdvFields({...advFields, vol: e.target.value})}/></div>
                                <div className="col-6 col-md-3"><select className="form-select form-select-sm" onChange={e=>setAdvFields({...advFields, div: e.target.value})}><option value="">Division</option><option>AD</option><option>HCD</option></select></div>
                                <div className="col-6 col-md-2"><input type="text" className="form-control form-control-sm" placeholder="Page" onChange={e=>setAdvFields({...advFields, page: e.target.value})}/></div>
                                <div className="col-12 col-md-2"><button className="btn btn-dark btn-sm w-100" onClick={()=>handleSearch(1, 'advanced')}>Go</button></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="container" style={{minHeight: '400px'}}>
            
            {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

            {/* Results View */}
            {view === 'results' && !loading && (
                <div id="resultsArea">
                    <p className="text-muted small mb-3">Found {totalCount} results</p>
                    {results.length === 0 && <div className="text-center mt-5 text-muted"><h5>No cases found.</h5></div>}
                    {results.map(item => (
                        <div key={item.id} className="result-item" onClick={()=>loadJudgment(item)}>
                            <h5>{item.title}</h5>
                            <div className="mb-2">
                                {(session && subStatus) ? 
                                    <><span className="badge bg-light text-dark border">{item.citation}</span> <span className="text-muted small ms-2">{item.division}</span></> : 
                                    <span className="badge bg-secondary text-white"><i className="fas fa-lock"></i> Premium</span>
                                }
                            </div>
                            <div className="headnote-text" style={{whiteSpace: 'pre-wrap', textAlign: 'justify'}}>
                                <HighlightedText text={item.headnote || ""} highlight={searchTerm || selectedLaw} />
                            </div>
                        </div>
                    ))}
                    
                    {/* Pagination */}
                    {totalCount > 20 && (
                        <nav className="mt-4 pb-5 d-flex justify-content-center">
                            <ul className="pagination">
                                <li className={`page-item ${currentPage===1?'disabled':''}`}><button className="page-link" onClick={()=>handleSearch(currentPage-1)}>&lt;</button></li>
                                <li className="page-item active"><button className="page-link">{currentPage}</button></li>
                                <li className="page-item"><button className="page-link" onClick={()=>handleSearch(currentPage+1)}>&gt;</button></li>
                            </ul>
                        </nav>
                    )}
                </div>
            )}

            {/* Reader View */}
            {view === 'reader' && !loading && currentJudgment && (
                <div id="readerView" className="bg-white p-4 p-md-5 rounded-3 shadow-sm border mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <button className="btn btn-outline-secondary btn-sm" onClick={()=>setView('results')}><i className="fas fa-arrow-left"></i> Back</button>
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-warning text-dark" onClick={()=>toggleBookmark(currentJudgment)}><i className="far fa-bookmark"></i> Save</button>
                            <button className="btn btn-sm btn-outline-dark" onClick={()=>window.print()}><i className="fas fa-print"></i> Print</button>
                        </div>
                    </div>
                    
                    <h3 className="fw-bold text-center text-primary mb-2" style={{fontFamily:'Playfair Display'}}>{currentJudgment.title}</h3>
                    
                    {/* Primary Citation */}
                    <p className="text-center text-dark fw-bold mb-2 fs-5">{currentJudgment.citation}</p>
                    
                    {/* Parallel Citations Display */}
                    {displayCitations.length > 0 && (
                        <div className="text-center mb-4">
                            <span className="text-secondary small fw-bold text-uppercase me-2">Also Reported In:</span>
                            {displayCitations.map((cite, index) => (
                                <span key={index} className="badge bg-light text-secondary border me-1">{cite}</span>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 text-justify" style={{whiteSpace: 'pre-wrap', fontFamily:'Merriweather', textAlign: 'justify'}}>
                        {judgmentText}
                    </div>
                </div>
            )}

            {/* Features */}
            {view === 'home' && (
                <div id="featuresSection" className="py-5">
                    <div className="row g-4 justify-content-center text-center">
                        <div className="col-6 col-md-3"><i className="fas fa-bolt fa-2x text-warning mb-3"></i><h6 className="fw-bold">Fast Search</h6></div>
                        <div className="col-6 col-md-3"><i className="fas fa-book fa-2x text-primary mb-3"></i><h6 className="fw-bold">All Laws</h6></div>
                        <div className="col-6 col-md-3"><i className="fas fa-mobile-alt fa-2x text-success mb-3"></i><h6 className="fw-bold">Mobile First</h6></div>
                        <div className="col-6 col-md-3"><i className="fas fa-headset fa-2x text-secondary mb-3"></i><h6 className="fw-bold">24/7 Support</h6></div>
                    </div>
                </div>
            )}
        </div>

        {/* Pricing */}
        <div className="packages-section" id="packages">
             <div className="container">
                <div className="text-center mb-5">
                    <h2 className="hero-title" style={{fontSize:'32px'}}>Simple, Transparent Pricing</h2>
                    <p class="text-muted">Choose the plan that fits your practice.</p>
                </div>
                <div className="row g-4 justify-content-center">
                    <div className="col-md-3 col-sm-6">
                        <div className="pricing-card">
                            <div className="plan-name">Monthly</div>
                            <div className="plan-price">199৳</div>
                            <div className="plan-desc">Billed monthly</div>
                            <a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt199/4NosNL" target="_blank" className="btn-plan">Get Started</a>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <div className="pricing-card popular">
                            <div className="best-value-badge">BEST VALUE</div>
                            <div className="plan-name">Half Yearly</div>
                            <div className="plan-price">799৳</div>
                            <div className="plan-desc">Save 33%</div>
                            <a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt499/IxcDIa" target="_blank" className="btn-plan">Get Started</a>
                        </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                        <div className="pricing-card">
                            <div className="plan-name">Yearly</div>
                            <div className="plan-price">1200৳</div>
                            <div className="plan-desc">Save 50%</div>
                            <a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt1200/O3FBxR" target="_blank" className="btn-plan">Get Started</a>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-5">
                    <button className="btn btn-link text-secondary text-decoration-none" onClick={()=>setModalMode('payment')}>
                        Already paid via bKash? <span className="text-primary fw-bold">Confirm Payment</span>
                    </button>
                </div>
             </div>
        </div>

        {/* --- MODALS --- */}
        {modalMode === 'login' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0 justify-content-center position-relative">
                            <h5 className="modal-title fw-bold">Welcome</h5>
                            <button className="btn-close position-absolute end-0 me-3" onClick={()=>setModalMode(null)}></button>
                        </div>
                        <div className="modal-body p-4">
                            <ul className="nav nav-pills nav-fill mb-3" id="pills-tab" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link active" id="pills-login-tab" data-bs-toggle="pill" data-bs-target="#pills-login" type="button">Login</button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link" id="pills-signup-tab" data-bs-toggle="pill" data-bs-target="#pills-signup" type="button">Sign Up</button>
                                </li>
                            </ul>
                            
                            <div className="tab-content" id="pills-tabContent">
                                {/* Login */}
                                <div className="tab-pane fade show active" id="pills-login">
                                    <form onSubmit={(e)=>{
                                        e.preventDefault(); 
                                        handleAuth(e.target.email.value, e.target.password.value, false);
                                    }}>
                                        <div className="mb-3">
                                            <label className="form-label small text-muted">Email</label>
                                            <input name="email" type="email" className="form-control" required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label small text-muted">Password</label>
                                            <input name="password" type="password" className="form-control" required />
                                        </div>
                                        <div className="text-end mb-3">
                                            <a href="#" className="text-decoration-none small text-muted" onClick={(e) => {
                                                e.preventDefault();
                                                const email = e.target.closest('form').querySelector('input[name="email"]').value;
                                                handlePasswordReset(email);
                                            }}>Forgot Password?</a>
                                        </div>
                                        <button className="btn btn-dark w-100 py-2">Login</button>
                                    </form>
                                </div>
                                {/* Sign Up */}
                                <div className="tab-pane fade" id="pills-signup">
                                    <form onSubmit={(e)=>{
                                        e.preventDefault(); 
                                        handleAuth(e.target.email.value, e.target.password.value, true);
                                    }}>
                                        <div className="mb-3">
                                            <label className="form-label small text-muted">Email</label>
                                            <input name="email" type="email" className="form-control" required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label small text-muted">Create Password</label>
                                            <input name="password" type="password" className="form-control" required minLength="6"/>
                                            <div className="form-text text-muted" style={{fontSize:'12px'}}>Min 6 characters</div>
                                        </div>
                                        <button className="btn btn-success text-white w-100 py-2">Create Account</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- Reset Password Modal --- */}
        {modalMode === 'resetPassword' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header"><h5 className="modal-title">Set New Password</h5></div>
                        <div className="modal-body p-4">
                            <form onSubmit={(e)=>{
                                e.preventDefault();
                                handleUpdatePassword(e.target.newPass.value);
                            }}>
                                <div className="mb-3">
                                    <label className="form-label">New Password</label>
                                    <input name="newPass" type="password" className="form-control" required minLength="6"/>
                                </div>
                                <button className="btn btn-primary w-100">Update Password</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- Session Error Modal (PROFESSIONAL POPUP) --- */}
        {modalMode === 'sessionError' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(3px)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content text-center p-0 border-0 shadow-lg" style={{overflow: 'hidden', borderRadius: '15px'}}>
                        <div className="bg-danger py-3">
                             <i className="fas fa-shield-alt fa-3x text-white"></i>
                        </div>
                        <div className="modal-body p-5">
                            <h3 className="fw-bold text-dark mb-3">Session Expired</h3>
                            <p className="text-muted mb-4" style={{fontSize: '16px', lineHeight: '1.6'}}>
                                You have logged in from another device.<br/>
                                For security reasons, this session has been terminated.
                            </p>
                            <button className="btn btn-danger rounded-pill px-5 py-2 fw-bold" onClick={()=>window.location.reload()}>
                                Login Here Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Profile Modal */}
        {modalMode === 'profile' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content overflow-hidden p-0">
                        <div className="modal-header border-0 position-relative d-flex justify-content-center align-items-center py-3 bg-dark text-white">
                            <h5 className="modal-title fw-bold m-0">My Account</h5>
                            <button className="btn-close btn-close-white position-absolute end-0 me-3" onClick={()=>setModalMode(null)}></button>
                        </div>
                        <div className="modal-body text-center p-4">
                            <i className="fas fa-user-circle fa-4x text-secondary mb-3"></i>
                            <h5 className="fw-bold mb-1">{profileData?.email || session?.user?.email || "Loading..."}</h5>
                            <span className={`badge mb-3 ${profileData?.isPremium ? 'bg-success' : 'bg-secondary'}`}>
                                {profileData?.isPremium ? 'Premium Member' : 'Free Member'}
                            </span>
                            
                            {profileData && (
                                <div className="card bg-light border-0 p-3 mt-3 text-start">
                                    <p className="mb-1 small text-muted text-uppercase fw-bold">Subscription Details</p>
                                    <div className="d-flex justify-content-between border-bottom pb-2 mb-2"><span>Expiry Date:</span><span className="fw-bold text-dark">{profileData.expDate}</span></div>
                                    <div className="d-flex justify-content-between"><span>Days Remaining:</span><span className="fw-bold text-primary">{profileData.diffDays}</span></div>
                                </div>
                            )}
                            
                            <button className="btn btn-outline-danger w-100 mt-4" onClick={handleLogout}>Sign Out</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* App Modal */}
        {modalMode === 'app' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content text-center p-5 border-0">
                        <div className="modal-body">
                            <i className="fas fa-android fa-4x text-success mb-3"></i>
                            <h3 className="fw-bold">Coming Soon!</h3>
                            <p className="text-muted mt-3">Our dedicated Android App is currently under development.</p>
                            <button className="btn btn-light rounded-pill px-4 mt-3" onClick={()=>setModalMode(null)}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Payment Confirmation Modal */}
        {modalMode === 'payment' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header"><h5 className="modal-title">Payment Verification</h5><button className="btn-close" onClick={()=>setModalMode(null)}></button></div>
                        <div className="modal-body p-4">
                            {/* Updated Form using onSubmit handler for Formspree AJAX */}
                            <form onSubmit={handlePaymentSubmit}>
                                <input type="hidden" name="_captcha" value="false"/><input type="hidden" name="_subject" value="New Payment"/>
                                <div className="mb-3"><label className="form-label">Name</label><input type="text" name="Name" className="form-control" required/></div>
                                <div className="mb-3"><label className="form-label">Phone</label><input type="text" name="Phone" className="form-control" required/></div>
                                <div className="mb-3"><label className="form-label">Email</label><input type="email" name="Email" className="form-control" required/></div>
                                <div className="row"><div className="col-6 mb-3"><label className="form-label">TrxID</label><input type="text" name="TrxID" className="form-control" required/></div><div className="col-6 mb-3"><label className="form-label">Plan</label><select name="Package" className="form-select"><option>Monthly</option><option>Half Yearly</option><option>Yearly</option></select></div></div>
                                <button className="btn btn-success w-100 py-2">Submit</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Payment Success Modal */}
        {modalMode === 'paymentSuccess' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg" style={{borderRadius: '20px', overflow: 'hidden'}}>
                        <div className="modal-body p-5 text-center">
                            <div className="mb-4" style={{width:'80px', height:'80px', background:'#28a74520', borderRadius:'50%', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <i className="fas fa-check fa-3x text-success"></i>
                            </div>
                            <h2 className="fw-bold mb-3" style={{color:'#333'}}>Success!</h2>
                            <p className="text-muted mb-4" style={{fontSize:'16px', lineHeight:'1.6'}}>
                                Thank you! Your payment verification request has been submitted securely.
                            </p>
                            <div className="p-3 bg-light rounded mb-4 text-start">
                                <small className="text-secondary fw-bold text-uppercase">What happens next?</small>
                                <ul className="mb-0 mt-2 ps-3 text-muted small">
                                    <li>Our team will verify your transaction ID.</li>
                                    <li>Your account will be upgraded within 30 minutes.</li>
                                    <li>You will receive a confirmation email shortly.</li>
                                </ul>
                            </div>
                            <button className="btn btn-success rounded-pill w-100 py-3 fw-bold" onClick={()=>setModalMode(null)}>
                                Continue to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Warning Modal */}
        {modalMode === 'warning' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header bg-warning"><h5 className="modal-title text-dark">🔒 Login Required</h5><button className="btn-close" onClick={()=>setModalMode(null)}></button></div>
                        <div className="modal-body p-4 text-center">
                            <p className="lead">This is a <strong>Premium</strong> Judgment.</p>
                            <p className="text-muted mb-4">You need to login to read the full text.</p>
                            <button className="btn btn-dark w-100" onClick={()=>setModalMode('login')}>Login Now</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Gate Modal */}
        {modalMode === 'gate' && (
            <div className="modal d-block" style={{background: 'rgba(0,0,0,0.5)'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content text-center p-5 border-0 shadow">
                        <div className="modal-body">
                            <i className="fas fa-check-circle fa-4x text-success mb-4"></i>
                            <h3 className="fw-bold text-dark">Judgment Found!</h3>
                            <p className="text-muted mt-3 mb-4">Great news! The case is in our database.<br/>However, <b>Advanced Search</b> is a <b>Premium Feature</b>.</p>
                            <div className="d-grid gap-2">
                                <a href="#packages" className="btn btn-dark" onClick={()=>setModalMode(null)}>View Plans</a>
                                <button className="btn btn-outline-secondary" onClick={()=>setModalMode(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Footer */}
        <footer className="bg-dark text-secondary py-5 text-center">
            <div className="container">
                <h4 className="text-white fw-bold mb-4">BDKanoon</h4>
                <div className="mb-4">
                    <a href="#" className="footer-link">Home</a>
                    <a href="#packages" className="footer-link">Pricing</a>
                    <a href="#" className="footer-link">Privacy Policy</a>
                </div>
                <p className="mb-1">Supreme Court, Dhaka.</p>
                <p className="mb-1">Email: bdkanoon@gmail.com</p>
                <p className="mb-4">Phone: 01911 008 518</p>
                <p class="small opacity-50">&copy; 2026 BDKanoon. All rights reserved.</p>
            </div>
        </footer>
        <a href="https://wa.me/8801911008518" className="whatsapp-float" target="_blank"><i className="fab fa-whatsapp"></i></a>
    </div>
  );
}
