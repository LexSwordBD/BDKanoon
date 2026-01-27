import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

// --- Error Boundary Component (For White Screen Fix) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Crash Error:", error, errorInfo);
    // Clear Google Translate cookies to prevent crash loops
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    localStorage.clear();
    sessionStorage.clear();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4">
          <h3 className="text-danger mb-3">Something went wrong.</h3>
          <p className="text-muted">We have detected an issue. Please reload to fix it.</p>
          <button className="btn btn-dark rounded-pill px-4" onClick={() => window.location.reload()}>Reload App</button>
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

const lawAliases = {
  // --- Constitutional & Procedural ---
  'Constitution of Bangladesh (সংবিধান)': ['Constitution', 'Konstitution', 'Art.', 'Article', 'Writ Petition', 'Fundamental Rights', 'সংবিধান'],
  'Code of Civil Procedure (CPC/দেওয়ানী)': ['CPC', 'Code of Civil Procedure', 'Civil Procedure', 'C.P.C', 'Civil Revision', 'Civil Appeal', 'Order', 'Rule', 'দেওয়ানী'],
  'Code of Criminal Procedure (CrPC/ফৌজদারী)': ['CrPC', 'Code of Criminal Procedure', 'Criminal Procedure', 'Cr.P.C', 'Criminal Misc', 'Criminal Revision', 'Criminal Appeal', '561A', '498', 's. 144', '164', '342', 'fouz dari', 'ফৌজদারী'],
  'Penal Code (দণ্ডবিধি)': ['Penal', 'PC', 'P.C', 'dondobidhi', '302', '304', '395', '397', '420', '406', '1860', 'Penal Code', 'দণ্ডবিধি'],
  'Evidence Act (সাক্ষ্য আইন)': ['Evidence', 'sakkho', 'sakhho', 'Burden of proof', 'Confession', 'Expert opinion', 'সাক্ষ্য'],
  'Limitation Act (তামাদি আইন)': ['Limitation', 'Section 5', 'condonation', 'delay', 'Time barred', 'তামাদি'],
  'Specific Relief Act (সুনির্দিষ্ট প্রতিকার)': ['Specific Relief', 'SR Act', 'S.R. Act', 'Section 9', 'Section 42', 'Permanent Injunction', 'Declaration', 'সুনির্দিষ্ট প্রতিকার'],
  'General Clauses Act (জেনারেল ক্লজেস)': ['General Clauses', 'Section 6', 'Interpretation', 'জেনারেল ক্লজেস'],

  // --- Special Criminal Laws ---
  'Nari O Shishu Nirjatan Daman Ain (নারী ও শিশু)': ['Nari O Shishu', 'Women and Children', 'Nari-O-Shishu', 'Trafficking', 'Rape', 'Sexual Assault', 'Abduction', 'নারী ও শিশু', 'নারী শিশু'],
  'Dowry Prohibition Act (যৌতুক নিরোধ)': ['Dowry', 'Joutuk', 'Demand of dowry', 'যৌতুক'],
  'Human Trafficking Deterrence Act (মানব পাচার)': ['Human Trafficking', 'Trafficking', 'Paachar', 'মানব পাচার'],
  'Pornography Control Act (পর্নোগ্রাফি নিয়ন্ত্রণ)': ['Pornography', 'Porno', 'পর্নোগ্রাফি'],
  'Special Powers Act (বিশেষ ক্ষমতা)': ['Special Powers', 'SPA', 'Special Power', 'Detention', 'Smuggling', 'Black marketing', 'বিশেষ ক্ষমতা'],
  'Anti-Terrorism Act (সন্ত্রাস বিরোধী)': ['Anti-Terrorism', 'Terrorism', 'Militant', 'সন্ত্রাস'],
  'Arms Act (অস্ত্র আইন)': ['Arms Act', 'Illegal Arms', 'Firearms', 'Possession of arms', 'অস্ত্র'],
  'Narcotics Control Act (মাদক দ্রব্য নিয়ন্ত্রণ)': ['Narcotics', 'Madok', 'Drug', 'Table', 'Yaba', 'Heroin', 'Phensedyl', 'Ganja', 'Alcohol', 'মাদক'],
  'Ain Srinkhola Bighnokari (দ্রুত বিচার)': ['Druto Bichar', 'Speedy Trial', 'Disrupting Law and Order', 'দ্রুত বিচার'],
  'Digital Security & ICT Act (ডিজিটাল/সাইবার)': ['Digital Security', 'Cyber', 'ICT Act', 'Information and Communication', 'Hacking', 'Defamation online', 'ডিজিটাল নিরাপত্তা', 'সাইবার'],
  'Mobile Court Act (মোবাইল কোর্ট)': ['Mobile Court', 'Executive Magistrate', 'মোবাইল কোর্ট'],
  'Corruption & ACC Act (দুদক/দুর্নীতি)': ['Anti-Corruption', 'ACC', 'Dudok', 'Graft', 'Misappropriation', 'Corruption', 'দুদক', 'দুর্নীতি'],
  'Money Laundering Prevention Act (মানি লন্ডারিং)': ['Money Laundering', 'Laundering', 'মানি লন্ডারিং'],

  // --- Civil, Commercial & Financial ---
  'Artha Rin Adalat Ain (অর্থ ঋণ আদালত)': ['Artha Rin', 'Money Loan', 'Adalat', 'Loan recovery', 'Mortgage', 'Auction', 'অর্থ ঋণ'],
  'Negotiable Instruments Act (NI Act/চেক ডিজঅনার)': ['Negotiable Instruments', 'NI Act', 'N.I. Act', '138', 'Cheque', 'Dishonour', 'Payment', 'চেক'],
  'Transfer of Property Act (সম্পত্তি হস্তান্তর)': ['Transfer of Property', 'TP Act', 'T.P. Act', 'Lease', 'Mortgage', 'Gift', 'Sale deed', 'Lis pendens', 'সম্পত্তি হস্তান্তর'],
  'Registration Act (রেজিস্ট্রেশন)': ['Registration', 'Section 17', 'Registered deed', 'রেজিস্ট্রেশন'],
  'Contract Act (চুক্তি আইন)': ['Contract Act', 'Agreement', 'Breach of contract', 'Specific performance', 'চুক্তি'],
  'Real Estate Act (রিয়েল এস্টেট)': ['Real Estate', 'Developer', 'Landowner', 'Signing money', 'Flat', 'Plot', 'Handover', 'Power of Attorney', 'রিয়েল এস্টেট', 'ডেভেলপার'],
  'Arbitration Act (সালিশ আইন)': ['Arbitration', 'Arbitrator', 'Award', 'Section 34', 'সালিশ'],
  'Companies Act (কোম্পানি আইন)': ['Companies Act', 'Company Law', 'Winding up', 'Share', 'Director', 'Rectification', 'RJSC', 'কোম্পানি'],
  'Bankruptcy Act (দেউলিয়া আইন)': ['Bankruptcy', 'Insolvency', 'Receiver', 'দেউলিয়া'],
  'VAT & Customs (ভ্যাট ও কাস্টমস)': ['Value Added Tax', 'VAT', 'Musok', 'Customs', 'Duty', 'Tariff', 'Bond', 'ভ্যাট', 'কাস্টমস'],
  'Income Tax Ordinance (আয়কর)': ['Income Tax', 'Tax', 'Taxes', 'Assessment', 'Return', 'আয়কর'],

  // --- Land & Property ---
  'State Acquisition & Tenancy Act (প্রজাস্বত্ব)': ['State Acquisition', 'SAT Act', 'Tenancy', 'Pre-emption', 'Ogrorkoy', 'Khatian', 'Record of rights', 'প্রজাস্বত্ব'],
  'Vested Property Return Act (অর্পিত সম্পত্তি)': ['Vested Property', 'Enemy Property', 'VP', 'Return of property', 'অর্পিত', 'Vested'],
  'Non-Agricultural Tenancy Act (অ-কৃষি প্রজাস্বত্ব)': ['Non-Agricultural', 'Non-agri', 'Chandina', 'অ-কৃষি'],
  'Land Survey Tribunal (ভূমি জরিপ)': ['Land Survey', 'L.S.T', 'Tribunal', 'Survey', 'জরিপ'],
  'Trust Act (ট্রাস্ট আইন)': ['Trust Act', 'Trustee', 'Beneficiary'],
   
  // --- Family & Personal ---
  'Muslim Family Laws (মুসলিম পারিবারিক আইন)': ['Muslim Family', 'MFLO', 'Denmohar', 'Dower', 'Talaq', 'Divorce', 'Maintenance', 'Polygamy'],
  'Family Courts Ordinance (পারিবারিক আদালত)': ['Family Courts', 'Family Court', 'Restitution of conjugal rights', 'পারিবারিক'],
  'Guardians and Wards Act (অভিভাবক ও প্রতিপাল্য)': ['Guardians and Wards', 'Guardian', 'Custody', 'Welfare of minor', 'অভিভাবক'],
  'Succession Act (উত্তরাধিকার)': ['Succession', 'Will', 'Probate', 'Letters of Administration', 'Heir', 'উত্তরাধিকার'],

  // --- Administrative & Others ---
  'Administrative Tribunals Act (প্রশাসনিক ট্রাইব্যুনাল)': ['Administrative Tribunal', 'Admin Tribunal', 'KAT', 'A.T.', 'Service matter', 'Pension', 'Disciplinary', 'প্রশাসনিক ট্রাইব্যুনাল'],
  'Bangladesh Labor Act (শ্রম আইন)': ['Labor Act', 'Labour', 'Employment', 'Worker', 'Wages', 'Compensation', 'Dismissal', 'Termination', 'Trade Union', 'শ্রম'],
  'Road Transport & Motor Vehicles (সড়ক পরিবহন)': ['Road Transport', 'Motor Vehicles', 'Accident', 'Driving License', 'Compensation', 'সড়ক পরিবহন', 'মোটরযান'],
  'Environment Conservation Act (পরিবেশ সংরক্ষণ)': ['Environment', 'Pollution', 'Brick Kiln', 'DoE', 'পরিবেশ'],
  'Consumer Rights Protection Act (ভোক্তা অধিকার)': ['Consumer Rights', 'Consumer', 'DNCRP', 'ভোক্তা অধিকার'],
  'Food Safety Act (নিরাপদ খাদ্য)': ['Food Safety', 'Adulteration', 'Pure Food', 'নিরাপদ খাদ্য'],
  'Right to Information Act (তথ্য অধিকার)': ['Right to Information', 'RTI', 'তথ্য অধিকার']
};

const stopwords = ['a', 'an', 'the', 'of', 'in', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'shall', 'will', 'am', 'i', 'my', 'me', 'we', 'our', 'it', 'its', 'that', 'this', 'those', 'these'];

const HighlightedText = ({ text, highlight, isExactMatch }) => {
  if (!text) return null;
  if (!highlight) return <span>{text}</span>;

  try {
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let regex;

    if (isExactMatch) {
      const exactPhrase = escapeRegExp(highlight.trim());
      regex = new RegExp(`(${exactPhrase})`, 'gi');
    } else {
      const words = highlight.split(/\s+/)
        .filter(w => w.length > 0 && !stopwords.includes(w.toLowerCase()))
        .map(escapeRegExp);
      
      if (words.length === 0) return <span>{text}</span>;
      regex = new RegExp(`(${words.join('|')})`, 'gi');
    }

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

// --- Main App Logic ---
function AppContent() {
  const [session, setSession] = useState(null);
  const [subStatus, setSubStatus] = useState(false);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Search & Suggestions States
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedLaw, setSelectedLaw] = useState('');
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [showAdvSearch, setShowAdvSearch] = useState(false);
  const [advFields, setAdvFields] = useState({ journal: '', vol: '', div: '', page: '' });

  const [currentJudgment, setCurrentJudgment] = useState(null);
  const [judgmentText, setJudgmentText] = useState('');
  const [parallelCitations, setParallelCitations] = useState([]);

  const [modalMode, setModalMode] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);

  // Local Notice (Toast)
  const [notice, setNotice] = useState(null);
  const openNotice = (payload) => setNotice(payload);
  const closeNotice = () => setNotice(null);

  // --- Admin & Notification States ---
  const [globalNotifications, setGlobalNotifications] = useState([]);
  const [adminMsgInput, setAdminMsgInput] = useState('');
  const [adminTitleInput, setAdminTitleInput] = useState('');
  const [adminMsgType, setAdminMsgType] = useState('info'); 
  const [adminExpiryInput, setAdminExpiryInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('notifications'); // 'notifications' or 'dataEntry'

  // --- Admin Data Entry States (Advanced) ---
  const [entryTitle, setEntryTitle] = useState('');
  const [entryCitations, setEntryCitations] = useState(''); // Comma separated citations
  const [entryHeadnote, setEntryHeadnote] = useState('');
  const [entryTargetFile, setEntryTargetFile] = useState('75dlr_case.txt'); 
  const [entryFullText, setEntryFullText] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // --- Translation State ---
  const [isTranslated, setIsTranslated] = useState(false);

  const disclaimerText = "Please note that while every effort has been made to provide accurate case references, there may be some unintentional errors. We encourage users to verify the information from official sources for complete accuracy.";

  // --- Google Translate Initialization & Hiding Toolbar (AGGRESSIVE MODE) ---
  useEffect(() => {
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
        multilanguagePage: true, 
      }, 'google_translate_element');
    };

    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame, .skiptranslate iframe, iframe#goog-gt-tt { 
          display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; opacity: 0 !important; pointer-events: none !important;
      }
      body { top: 0px !important; position: static !important; margin-top: 0 !important; }
      html { height: 100%; overflow-y: auto; }
      .goog-tooltip { display: none !important; }
      .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
      #google_translate_element, .goog-te-gadget { display: none !important; }
      .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
      #goog-gt-tt { display: none !important; visibility: hidden !important; }
      @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600&display=swap');
      .translated-mode .judgment-content, .translated-mode .judgment-content * {
          font-family: 'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', sans-serif !important;
          line-height: 2 !important; font-size: 1.15rem !important; text-align: justify !important; color: #222;
      }
      font { background-color: transparent !important; box-shadow: none !important; color: inherit !important; }
    `;
    document.head.appendChild(style);
  }, []);

  // --- Toggle Language Helper ---
  const toggleLanguage = () => {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      if (isTranslated) {
        select.value = 'en'; 
        select.dispatchEvent(new Event('change'));
        setIsTranslated(false);
      } else {
        select.value = 'bn';
        select.dispatchEvent(new Event('change'));
        setIsTranslated(true);
      }
    } else {
        openNotice({ type: 'warning', title: 'System Initializing', message: 'Translation engine is getting ready. Please try again in 5 seconds.' });
    }
  };

  const fetchGlobalNotifications = async () => {
    try {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (data) {
         const dismissed = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]');
         const now = new Date();
         const validNotifications = data.filter(n => {
            if (dismissed.includes(n.id)) return false;
            if (n.expires_at) { if (now > new Date(n.expires_at)) return false; }
            return true;
         });
         if (isAdmin) setGlobalNotifications(data); else setGlobalNotifications(validNotifications);
      }
    } catch (e) {}
  };

  const dismissNotification = (id) => {
      setGlobalNotifications(prev => prev.filter(n => n.id !== id));
      const dismissed = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]');
      if (!dismissed.includes(id)) { dismissed.push(id); localStorage.setItem('dismissed_notifs', JSON.stringify(dismissed)); }
  };

  const deleteNotification = async (id) => {
    if (!isAdmin) return; if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) { openNotice({ type: 'success', title: 'Deleted', message: 'Removed.' }); fetchGlobalNotifications(); }
  };

  const sendAdminNotification = async (e) => {
    e.preventDefault(); if (!adminTitleInput || !adminMsgInput) return;
    const payload = { title: adminTitleInput, message: adminMsgInput, type: adminMsgType, expires_at: adminExpiryInput ? new Date(adminExpiryInput).toISOString() : null };
    let error;
    if (isEditing && editingId) { const res = await supabase.from('notifications').update(payload).eq('id', editingId); error = res.error; } 
    else { const res = await supabase.from('notifications').insert([{ ...payload, created_at: new Date() }]); error = res.error; }
    if (error) openNotice({ type: 'error', title: 'Failed', message: error.message });
    else { openNotice({ type: 'success', title: isEditing ? 'Updated' : 'Sent', message: 'Success.' }); cancelEdit(); fetchGlobalNotifications(); }
  };

  const handleEditClick = (notif) => {
      setIsEditing(true); setEditingId(notif.id); setAdminTitleInput(notif.title); setAdminMsgInput(notif.message); setAdminMsgType(notif.type);
      if (notif.expires_at) { const d = new Date(notif.expires_at); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); setAdminExpiryInput(d.toISOString().slice(0, 16)); } else { setAdminExpiryInput(''); }
  };

  const cancelEdit = () => { setIsEditing(false); setEditingId(null); setAdminTitleInput(''); setAdminMsgInput(''); setAdminMsgType('info'); setAdminExpiryInput(''); };

  // --- AUTOMATED DATA ENTRY LOGIC (Handle Multiple Citations) ---
  const handleDataEntrySubmit = async (e) => {
      e.preventDefault();
      
      // Basic Validation
      if(!entryTitle || !entryHeadnote || !entryCitations || !entryFullText || !entryTargetFile) { 
          openNotice({type:'warning', title:'Fields Empty', message:'Please fill all fields.'}); return; 
      }
      if(!githubToken) { 
          openNotice({type:'warning', title:'Token Missing', message:'Please enter GitHub PAT.'}); return; 
      }
      
      setIsUploading(true);
      
      try {
          // 1. Process Citations (Split by comma)
          // Input example: "75 DLR (AD) 65, 23 ALR (AD) 43"
          const citationList = entryCitations.split(',').map(c => c.trim()).filter(c => c.length > 0);
          
          if(citationList.length === 0) throw new Error("No valid citations found.");

          // 2. Generate Anchors and DB Rows
          const dbRows = [];
          let anchorsString = "";

          // Regex to parse citation components: Vol Journal (Div) Page
          // Matches: "75 DLR (AD) 65" -> 75, DLR, AD, 65
          const citationRegex = /^(\d+)\s+([a-zA-Z]+)\s*\(([a-zA-Z]+)\)\s+(\d+)$/;

          for (const cite of citationList) {
              // Generate Anchor: Remove spaces/symbols -> 75DLRAD65
              const anchor = cite.replace(/[^a-zA-Z0-9]/g, '');
              anchorsString += `===${anchor}=== `; // Add space for separation in text file

              // Parse details for Supabase
              const match = cite.match(citationRegex);
              
              // Default values if regex fails (fallback)
              let vol = '', journal = '', div = '', page = 0;
              
              if(match) {
                  vol = match[1];
                  journal = match[2];
                  div = match[3];
                  page = parseInt(match[4]);
              } else {
                  // Attempt simpler parse or fallback if regex fails
                  console.warn("Regex mismatch for citation:", cite);
              }

              dbRows.push({
                  title: entryTitle,
                  citation: cite,
                  headnote: entryHeadnote,
                  github_filename: entryTargetFile,
                  case_anchor: anchor, // Unique anchor for this specific citation
                  journal: journal,
                  volume: vol,
                  division: div,
                  page_number: page,
                  is_premium: true
              });
          }

          // 3. Prepare GitHub Content
          // Append all anchors followed by the text, then End marker
          const newContentBlock = `\n\n${anchorsString}\n${entryFullText}\n===End===`;

          // 4. Fetch Existing File from GitHub
          const fileUrl = `https://api.github.com/repos/${githubUser}/${repoName}/contents/judgments/${entryTargetFile}`;
          const getRes = await fetch(fileUrl, { headers: { Authorization: `token ${githubToken}` } });
          
          let content = "";
          let sha = "";

          if(getRes.ok) {
              const fileData = await getRes.json();
              // GitHub API returns content in Base64
              content = decodeURIComponent(escape(atob(fileData.content)));
              sha = fileData.sha;
          } else if(getRes.status === 404) {
              // File doesn't exist, create new (content remains empty)
          } else {
              throw new Error("GitHub Fetch Failed: Check Token/Repo");
          }

          // 5. Append & Upload to GitHub
          const updatedContent = content + newContentBlock;
          const encodedContent = btoa(unescape(encodeURIComponent(updatedContent)));

          const putRes = await fetch(fileUrl, {
              method: 'PUT',
              headers: { Authorization: `token ${githubToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  message: `Add case: ${citationList[0]} + ${citationList.length - 1} others`,
                  content: encodedContent,
                  sha: sha || undefined
              })
          });

          if(!putRes.ok) throw new Error("GitHub Upload Failed");

          // 6. Insert Multiple Rows into Supabase
          const { error: dbError } = await supabase.from('cases').insert(dbRows);

          if(dbError) throw new Error("Database Insert Failed: " + dbError.message);

          openNotice({type:'success', title:'Upload Complete', message:`Saved ${dbRows.length} citations to DB and GitHub.`});
          
          // Reset form fields
          setEntryTitle(''); setEntryHeadnote(''); setEntryCitations(''); setEntryFullText('');

      } catch (err) {
          console.error(err);
          openNotice({type:'error', title:'Error', message: err.message});
      } finally {
          setIsUploading(false);
      }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    if(savedToken) setGithubToken(savedToken);
  }, []);

  const saveToken = (val) => {
      setGithubToken(val);
      localStorage.setItem('gh_token', val);
  };

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); });
    fetchGlobalNotifications(); 
  }, [isAdmin]); 

  useEffect(() => {
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) { metaTheme = document.createElement('meta'); metaTheme.name = "theme-color"; document.head.appendChild(metaTheme); }
    metaTheme.content = "#ffffff";
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) { setIsNavbarVisible(false); } else { setIsNavbarVisible(true); }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const hardClearAuthStorage = () => {
    try { Object.keys(localStorage || {}).forEach((k) => { if (k.startsWith('sb-') && k.endsWith('-auth-token')) localStorage.removeItem(k); }); } catch (e) { }
    try { Object.keys(sessionStorage || {}).forEach((k) => { if (k.startsWith('sb-') && k.endsWith('-auth-token')) sessionStorage.removeItem(k); }); } catch (e) { }
  };

  const forceSignOut = async ({ title, message }) => {
    try { await supabase.auth.signOut(); } catch (e) { }
    hardClearAuthStorage(); setSession(null); setSubStatus(false); setProfileData(null); setIsAdmin(false); setModalMode('login');
    openNotice({ type: 'warning', title: title || 'Signed Out', message: message || 'Your session has ended.', primaryText: 'OK', onPrimary: closeNotice });
  };

  const parseLoginIdentifier = (input) => { const v = (input || '').trim(); return (v.includes('@')) ? { type: 'email', value: v.toLowerCase() } : { type: 'phone', value: v }; };
  const normalizePhoneCandidates = (raw) => {
    let s = (raw || '').trim().replace(/[^\d+]/g, ''); if (!s) return []; if (s.startsWith('00')) s = '+' + s.slice(2);
    const c = new Set(); c.add(s);
    if (/^01\d{9}$/.test(s)) { c.add('+88' + s); c.add('88' + s); c.add(s); }
    if (/^8801\d{9}$/.test(s)) { c.add('+' + s); c.add(s); c.add(s.replace(/^88/, '')); }
    if (/^\+8801\d{9}$/.test(s)) { c.add(s); c.add(s.replace(/^\+/, '')); c.add(s.replace(/^\+88/, '')); }
    if (/^880\d{10}$/.test(s)) c.add('+' + s);
    return Array.from(c);
  };

  const fetchMemberRow = async (user) => {
    if (!user) return { data: null, error: null };
    try { const r = await supabase.from('members').select('*').eq('id', user.id).maybeSingle(); if (r?.data) return r; } catch (e) { }
    if (user.email) { try { const r = await supabase.from('members').select('*').eq('email', user.email).limit(1).maybeSingle(); if (r?.data) return r; } catch (e) { } }
    if (user.phone) {
      const c = normalizePhoneCandidates(user.phone);
      for (const col of ['phone', 'mobile', 'mobile_number', 'phone_number']) { try { const r = await supabase.from('members').select('*').in(col, c).limit(1).maybeSingle(); if (r?.data) return r; } catch (e) { } }
    }
    return { data: null, error: null };
  };

  useEffect(() => {
    const styleId = 'no-copy-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id = styleId;
      style.innerHTML = `body.nocopy, body.nocopy *{ -webkit-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; } body.nocopy input, body.nocopy textarea, body.nocopy [contenteditable="true"]{ -webkit-user-select: text !important; user-select: text !important; } @media print{ body.nocopy, body.nocopy *{ -webkit-user-select: text !important; user-select: text !important; } }`;
      document.head.appendChild(style);
    }
    document.body.classList.add('nocopy');
    const onCopy = (e) => { if (['input','textarea'].includes((e.target.tagName||'').toLowerCase()) || e.target.isContentEditable) return; e.preventDefault(); openNotice({ type: 'warning', title: 'Copy Disabled', message: 'Use Print button.', primaryText: 'OK', onPrimary: closeNotice }); };
    const onContextMenu = (e) => { if (['input','textarea'].includes((e.target.tagName||'').toLowerCase()) || e.target.isContentEditable) return; e.preventDefault(); openNotice({ type: 'info', title: 'Protected', message: 'Right-click disabled.', primaryText: 'OK', onPrimary: closeNotice }); };
    document.addEventListener('copy', onCopy); document.addEventListener('cut', onCut); document.addEventListener('contextmenu', onContextMenu);
    return () => { document.removeEventListener('copy', onCopy); document.removeEventListener('cut', onCut); document.removeEventListener('contextmenu', onContextMenu); };
  }, []);

  useEffect(() => {
    let sessionInterval; let isMounted = true;
    const initSession = async () => {
      setLoading(true);
      const hash = window.location.hash; if (hash && (hash.includes('type=recovery') || hash.includes('error_description'))) setModalMode('resetPassword');
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) hardClearAuthStorage();
        if (isMounted) {
          setSession(data?.session); setIsAdmin(data?.session?.user?.email === ADMIN_EMAIL); setLoading(false);
          if (data?.session) { checkSubscription(data.session.user); updateSessionInDB(data.session); if (sessionInterval) clearInterval(sessionInterval); sessionInterval = startSessionMonitor(data.session); } else { setSubStatus(false); setProfileData(null); }
        }
      } catch (error) { hardClearAuthStorage(); if (isMounted) setLoading(false); }
    };
    initSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return; setSession(session); setIsAdmin(session?.user?.email === ADMIN_EMAIL); setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setModalMode('resetPassword');
      if (session) { checkSubscription(session.user); if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') { updateSessionInDB(session); if (sessionInterval) clearInterval(sessionInterval); sessionInterval = startSessionMonitor(session); } } else { setSubStatus(false); setProfileData(null); if (sessionInterval) clearInterval(sessionInterval); }
    });
    return () => { isMounted = false; subscription.unsubscribe(); if (sessionInterval) clearInterval(sessionInterval); };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedTerm = searchTerm.trim();
      if (trimmedTerm.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
      const { data } = await supabase.from('cases').select('headnote').ilike('headnote', `%${trimmedTerm}%`).limit(30);
      if (data) {
        const phraseSet = new Set();
        data.forEach(item => { if (!item.headnote) return; const match = item.headnote.match(new RegExp(`\\b${trimmedTerm}[\\w]*(\\s+[\\w]+){0,3}`, 'i')); if (match) { let phrase = match[0].replace(/[.,;:"()]/g, '').trim(); if(phrase.length > 2) phraseSet.add(phrase.charAt(0).toUpperCase() + phrase.slice(1).toLowerCase()); } });
        setSuggestions(Array.from(phraseSet).slice(0, 10)); setShowSuggestions(true);
      }
    };
    const debounceTimer = setTimeout(fetchSuggestions, 300); return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const updateSessionInDB = async (currentSession) => {
    if (!currentSession?.user) return; const token = currentSession.access_token; const user = currentSession.user;
    try { await supabase.from('members').update({ current_session_id: token }).eq('id', user.id); if (user.email) await supabase.from('members').update({ current_session_id: token }).eq('email', user.email); } catch (err) { }
  };

  const startSessionMonitor = (currentSession) => {
    return setInterval(async () => {
      if (!currentSession?.user) return; const user = currentSession.user;
      try {
        const { data: memberRow } = await fetchMemberRow(user); if (!memberRow) { await forceSignOut({ title: 'Removed', message: 'Account not found.' }); return; }
        const r = await supabase.from('members').select('current_session_id').eq('id', user.id).maybeSingle();
        if (r?.data?.current_session_id && r.data.current_session_id !== currentSession.access_token) { await supabase.auth.signOut(); hardClearAuthStorage(); setSession(null); setSubStatus(false); setModalMode('sessionError'); }
      } catch (e) { }
    }, 5000);
  };

  const checkSubscription = async (user) => {
    if (!user) return;
    try {
      const { data } = await fetchMemberRow(user); if (!data) { await forceSignOut({ title: 'Not Registered', message: 'Please sign up.' }); return; }
      if (data.expiry_date) {
        const expDate = new Date(data.expiry_date); const today = new Date();
        if (isNaN(expDate.getTime())) { setSubStatus(false); setProfileData({ ...data, isPremium: false, diffDays: 0, expDate: 'N/A', isExpired: true }); return; }
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        setSubStatus(diffDays >= 0); setProfileData({ ...data, isPremium: diffDays >= 0, diffDays: diffDays > 0 ? diffDays : 0, expDate: expDate.toDateString(), isExpired: diffDays < 0 });
      } else { setSubStatus(false); setProfileData({ ...data, email: data.email || user.email, isPremium: false, diffDays: 0, expDate: 'Free Plan', isExpired: false }); }
    } catch (e) { setSubStatus(false); setProfileData({ email: user.email, isPremium: false, diffDays: 0, expDate: 'N/A', isExpired: false }); }
  };

  const handleInstallClick = async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') setDeferredPrompt(null); } else setModalMode('app'); };

  const handleBackToResults = () => { if (isTranslated) { toggleLanguage(); } setView('results'); }

  const handleSearch = async (page = 1, type = 'simple', termOverride = null) => {
    setLoading(true); setCurrentPage(page); setView('results'); setShowSuggestions(false); 
    if(isTranslated) toggleLanguage();
    try {
      let q = supabase.from('cases').select('*', { count: 'exact' });
      if (type === 'advanced') {
        const { journal, vol, div, page: pg } = advFields; if (!journal || !vol || !div || !pg) { openNotice({ type: 'warning', title: 'Missing Fields', message: 'Fill all fields.' }); setLoading(false); return; }
        q = q.eq('journal', journal).eq('volume', vol).eq('division', div).eq('page_number', pg);
      } else {
        const term = termOverride !== null ? termOverride : searchTerm; const safeTerm = term.replace(/[^\w\s\u0980-\u09FF-]/g, "");
        let aliasCond = selectedLaw ? (lawAliases[selectedLaw] || [selectedLaw]).map(a => `headnote.ilike.%${a}%,title.ilike.%${a}%`).join(',') : "";
        if (isExactMatch) { const str = `headnote.ilike.%${safeTerm}%,title.ilike.%${safeTerm}%`; q = aliasCond ? q.or(aliasCond + ',' + str) : q.or(str); }
        else {
          const words = safeTerm.split(/\s+/).filter(w => !stopwords.includes(w.toLowerCase()) && w.length > 1);
          let textCond = words.map(w => `headnote.ilike.%${w}%,title.ilike.%${w}%`).join(',');
          if (!textCond && !aliasCond) { setLoading(false); setResults([]); setTotalCount(0); return; }
          if (aliasCond && textCond) q = q.or(aliasCond + ',' + textCond); else if (aliasCond) q = q.or(aliasCond); else q = q.or(textCond);
        }
      }
      if (type === 'advanced' && (!session || !subStatus)) { const { count } = await q.range(0, 1); if (count > 0) { setModalMode('gate'); setLoading(false); return; } }
      const { data, error, count } = await q.range((page - 1) * 20, (page * 20) - 1).order('page_number', { ascending: true });
      if (data) { 
          const seen = new Set(); 
          setResults(data.filter(i => { if (!i.headnote) return true; const c = i.headnote.trim(); if(seen.has(c)) return false; seen.add(c); return true; })); 
          setTotalCount(count || 0); 
      }
      else if (error) openNotice({ type: 'error', title: 'Error', message: 'Search failed.' });
    } catch (e) { openNotice({ type: 'error', title: 'Error', message: 'Unexpected error.' }); } finally { setLoading(false); }
  };

  const loadJudgment = async (item) => {
    if (item.is_premium && (!session || !subStatus)) { setModalMode('warning'); return; }
    setLoading(true); setView('reader'); setCurrentJudgment(item); setParallelCitations([]);
    if (isTranslated) { const select = document.querySelector('.goog-te-combo'); if(select) { select.value = 'en'; select.dispatchEvent(new Event('change')); } setIsTranslated(false); }
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${githubUser}/${repoName}/main/judgments/${item.github_filename}`);
      if (!res.ok) throw new Error("File not found");
      const fullText = await res.text();
      const anchorStr = `===${item.case_anchor}===`; const anchorIdx = fullText.indexOf(anchorStr);
      if (anchorIdx === -1) throw new Error("Case anchor not found.");
      const endMarker = "===End==="; const endIdx = fullText.indexOf(endMarker, anchorIdx);
      if (endIdx === -1) throw new Error("End marker not found.");
      const prevEndIdx = fullText.lastIndexOf(endMarker, anchorIdx);
      let content = fullText.substring(prevEndIdx !== -1 ? prevEndIdx + endMarker.length : 0, endIdx).trim();
      const matches = [];
      while (true) { const match = /^\s*(===(.*?)===)/.exec(content); if (match) { if (!matches.includes(match[2].trim())) matches.push(match[2].trim()); content = content.replace(match[1], '').trimStart(); } else break; }
      setParallelCitations(matches); setJudgmentText(content);
    } catch (e) { setJudgmentText("Error: " + e.message); setParallelCitations([]); openNotice({ type: 'error', title: 'Load Failed', message: 'Could not load.' }); } finally { setLoading(false); }
  };

  const handleAuth = async (val, pass, isSign) => {
    setLoading(true);
    if (isSign) {
      const { data, error } = await supabase.auth.signUp({ email: val.trim().toLowerCase(), password: pass });
      if (error) openNotice({ type: 'error', title: 'Failed', message: error.message });
      else { try{ await supabase.from('members').insert([{ id: data.user.id, email: val, expiry_date: null }]); }catch(e){} await supabase.auth.signOut(); hardClearAuthStorage(); setModalMode('signupSuccess'); }
    } else {
      const p = parseLoginIdentifier(val); let res;
      try {
        if (p.type === 'email') res = await supabase.auth.signInWithPassword({ email: p.value, password: pass });
        else { const c = normalizePhoneCandidates(p.value); for (const ph of c) { res = await supabase.auth.signInWithPassword({ phone: ph, password: pass }); if (!res.error) break; } }
      } catch (e) { res = { error: e }; }
      if (res?.error) openNotice({ type: 'error', title: 'Login Failed', message: 'Wrong credentials.' });
      else { const { data } = await fetchMemberRow(res.data.user); if (!data) { await forceSignOut({ title: 'Not Registered', message: 'No account found.' }); } }
    }
    setLoading(false); if(!isSign) setModalMode(null);
  };

  const handlePasswordReset = async (val) => {
    if (!val || !val.includes('@')) { openNotice({ type: 'warning', title: 'Invalid Email', message: 'Enter valid email.' }); return; }
    setLoading(true); const { error } = await supabase.auth.resetPasswordForEmail(val.toLowerCase(), { redirectTo: siteLink });
    if (error) openNotice({ type: 'error', title: 'Failed', message: error.message }); else openNotice({ type: 'success', title: 'Sent', message: 'Check email.' }); setLoading(false);
  };

  const handleUpdatePassword = async (pass) => {
    setLoading(true); const { error } = await supabase.auth.updateUser({ password: pass });
    if (error) openNotice({ type: 'error', title: 'Failed', message: error.message }); else { openNotice({ type: 'success', title: 'Updated', message: 'Login now.' }); setModalMode('login'); window.location.hash = ''; } setLoading(false);
  };

  const handleLogout = async () => { setLoading(true); try { await supabase.auth.signOut(); } catch (e) {} hardClearAuthStorage(); setSession(null); setSubStatus(false); setProfileData(null); setIsAdmin(false); setModalMode(null); setLoading(false); window.location.reload(); };

  const toggleBookmark = async (item) => {
    if (!session) { setModalMode('login'); return; }
    const id = session.user.email || session.user.phone || 'unknown';
    const { data: ex } = await supabase.from('bookmarks').select('id').eq('email', id).eq('case_citation', item.citation).eq('case_anchor', item.case_anchor);
    if (ex && ex.length > 0) { await supabase.from('bookmarks').delete().eq('id', ex[0].id); openNotice({ type: 'info', title: 'Removed', message: 'Bookmark removed.' }); } else { await supabase.from('bookmarks').insert([{ email: id, case_title: item.title, case_citation: item.citation, case_anchor: item.case_anchor, github_filename: item.github_filename }]); openNotice({ type: 'success', title: 'Saved', message: 'Bookmark added.' }); }
  };

  const fetchBookmarks = async () => {
    if (!session) { setModalMode('login'); return; } setLoading(true);
    const { data } = await supabase.from('bookmarks').select('*').eq('email', session.user.email || session.user.phone);
    setLoading(false); if (data) { setResults(data.map(b => ({ id: b.id, title: b.case_title, citation: b.case_citation, case_anchor: b.case_anchor, github_filename: b.github_filename, is_premium: true, headnote: "Saved Bookmark" }))); setView('results'); setTotalCount(data.length); }
  };

  const handlePaymentSubmit = async (e) => { e.preventDefault(); setLoading(true); try { const r = await fetch("https://formspree.io/f/xgookqen", { method: "POST", body: new FormData(e.target), headers: { 'Accept': 'application/json' } }); if (r.ok) { setModalMode('paymentSuccess'); e.target.reset(); } else throw new Error(); } catch (e) { openNotice({ type: 'error', title: 'Failed', message: 'Try again.' }); } finally { setLoading(false); } };

  if (loading && !session && view === 'home' && !results.length) return <div className="d-flex justify-content-center align-items-center vh-100 bg-white"><div className="spinner-border text-primary" role="status"></div></div>;

  const noticeIcon = (type) => { if (type === 'success') return <i className="fas fa-check-circle fa-3x text-success"></i>; if (type === 'error') return <i className="fas fa-times-circle fa-3x text-danger"></i>; return <i className="fas fa-info-circle fa-3x text-primary"></i>; };

  return (
    <div>
      <div id="google_translate_element"></div>

      {globalNotifications.length > 0 && !isAdmin && (
         <div className="notranslate" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(5px)' }}>
            {globalNotifications.slice(0, 1).map((note) => (
                <div key={note.id} className="notification-modal-card" style={{ width: '90%', maxWidth: '420px', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeInScale 0.3s ease-out' }}>
                    <div style={{ padding: '25px', textAlign: 'center', position: 'relative', borderBottom: '1px solid #f0f0f0' }}>
                        <button onClick={() => dismissNotification(note.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#333', fontSize: '18px' }}><i className="fas fa-times"></i></button>
                        <div style={{ marginBottom: '15px' }}>{note.type === 'error' ? <i className="fas fa-exclamation-circle fa-3x text-danger"></i> : note.type === 'warning' ? <i className="fas fa-bell fa-3x text-warning"></i> : <i className="fas fa-info-circle fa-3x text-primary"></i>}</div>
                        <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '18px' }}>{note.title}</h5>
                    </div>
                    <div style={{ padding: '25px', color: '#555', fontSize: '15px', lineHeight: '1.6', textAlign: 'center' }}>{note.message}</div>
                    <div style={{ padding: '0 25px 25px 25px' }}><button className="btn btn-dark w-100 py-2 rounded-pill fw-bold" onClick={() => dismissNotification(note.id)}>Got it</button></div>
                </div>
            ))}
            <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
         </div>
      )}

      <nav className="navbar navbar-expand-lg fixed-top notranslate" style={{ transition: 'transform 0.3s ease-in-out', transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)', paddingTop: 'env(safe-area-inset-top)', height: 'auto' }}>
        <div className="container">
          <a className="navbar-brand" href="#" onClick={() => window.location.reload()}>BD<span>Kanoon</span></a>
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"><i className="fas fa-bars"></i></button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><a className="nav-link nav-link-close" href="#" onClick={() => { setView('home'); setResults([]); }}>Home</a></li>
              <li className="nav-item"><a className="nav-link nav-link-close" href="#" onClick={fetchBookmarks}>Bookmarks</a></li>
              <li className="nav-item"><a className="nav-link nav-link-close" href="#packages">Pricing</a></li>
              {isAdmin && (<li className="nav-item"><button className="btn btn-danger btn-sm rounded-pill px-3 ms-lg-3 fw-bold" onClick={() => setModalMode('adminPanel')}><i className="fas fa-user-shield me-2"></i>Admin Panel</button></li>)}
              <li className="nav-item"><button className="btn-app ms-lg-3 mt-3 mt-lg-0 border-0" onClick={handleInstallClick}><i className="fab fa-android"></i> {deferredPrompt ? 'Install App' : 'Get App'}</button></li>
              <li className="nav-item ms-lg-3 mt-3 mt-lg-0">{session ? (<button className="btn btn-outline-dark rounded-pill px-3 btn-sm" onClick={() => setModalMode('profile')}><i className="fas fa-user-circle"></i> Account</button>) : (<button className="btn btn-dark rounded-pill px-4 btn-sm" onClick={() => setModalMode('login')}>Login</button>)}</li>
            </ul>
          </div>
        </div>
      </nav>

      <div className={`hero-section notranslate ${view !== 'home' ? 'hero-shrunk' : ''}`} id="homeSection">
        <div className="hero-content">
          {view === 'home' && (<><h1 className="hero-title">Intelligent Legal Research.</h1><p className="hero-subtitle">Search over 20,000+ judgments from the Supreme Court of Bangladesh.</p></>)}
          <div className="search-container">
            <div className="search-container-box" style={{ position: 'relative' }}>
              <div className="law-select-wrapper">
                <input className="law-input" list="lawList" placeholder="Select Law..." onChange={(e) => setSelectedLaw(e.target.value)} />
                <datalist id="lawList">{Object.keys(lawAliases).map(law => <option key={law} value={law} />)}</datalist>
              </div>
              <input type="text" className="main-input" placeholder="Search keywords..." value={searchTerm} maxLength={50} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)} />
              <button className="btn btn-link text-secondary" onClick={() => setShowAdvSearch(!showAdvSearch)}><i className="fas fa-sliders-h"></i></button>
              <button className="btn-search-hero" onClick={() => handleSearch(1)}><i className="fas fa-arrow-right"></i></button>
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: '0', right: '0', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000, marginTop: '5px', overflow: 'hidden' }}>
                  {suggestions.map((item, index) => (<div key={index} onClick={() => { setSearchTerm(item); setShowSuggestions(false); handleSearch(1, 'simple', item); }} style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: index !== suggestions.length - 1 ? '1px solid #f1f5f9' : 'none', color: '#334155', fontSize: '15px', textAlign: 'left' }} onMouseOver={(e) => e.target.style.background = '#f8fafc'} onMouseOut={(e) => e.target.style.background = 'white'}><i className="fas fa-search text-secondary me-3 small"></i> {item}</div>))}
                </div>
              )}
            </div>
            <div className="d-flex justify-content-center gap-3 mt-3"><label className="small text-secondary d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}><input type="checkbox" onChange={(e) => setIsExactMatch(e.target.checked)} /> Exact Phrase Match</label></div>
            {showAdvSearch && (
              <div className="adv-search-panel" style={{ display: 'block' }}>
                <h6 className="small fw-bold text-uppercase text-secondary mb-3">Citation Search</h6>
                <div className="row g-2">
                  <div className="col-6 col-md-3"><select className="form-select form-select-sm" onChange={e => setAdvFields({ ...advFields, journal: e.target.value })}><option value="">Journal</option><option>ADC</option><option>ALR</option><option>BLC</option><option>BLD</option><option>BLT</option><option>CLR</option><option>DLR</option><option>LM</option><option>MLR</option><option>SCOB</option></select></div>
                  <div className="col-6 col-md-2"><input type="text" className="form-control form-control-sm" placeholder="Vol" onChange={e => setAdvFields({ ...advFields, vol: e.target.value })} /></div>
                  <div className="col-6 col-md-3"><select className="form-select form-select-sm" onChange={e => setAdvFields({ ...advFields, div: e.target.value })}><option value="">Division</option><option>AD</option><option>HCD</option></select></div>
                  <div className="col-6 col-md-2"><input type="text" className="form-control form-control-sm" placeholder="Page" onChange={e => setAdvFields({ ...advFields, page: e.target.value })} /></div>
                  <div className="col-12 col-md-2"><button className="btn btn-dark btn-sm w-100" onClick={() => handleSearch(1, 'advanced')}>Go</button></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ minHeight: '400px' }}>
        {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}
        {view === 'results' && !loading && (
          <div id="resultsArea" className="notranslate">
            <p className="text-muted small mb-3">Found {totalCount} results</p>
            {results.length === 0 && <div className="text-center mt-5 text-muted"><h5>No cases found.</h5></div>}
            {results.map(item => (
              <div key={item.id} className="result-item" onClick={() => loadJudgment(item)}>
                <h5>{item.title}</h5>
                <div className="mb-2">{(session && subStatus) ? <><span className="badge bg-light text-dark border">{item.citation}</span> <span className="text-muted small ms-2">{item.division}</span></> : <span className="badge bg-secondary text-white"><i className="fas fa-lock"></i> Premium</span>}</div>
                <div className="headnote-text" style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}><HighlightedText text={item.headnote || ""} highlight={searchTerm || selectedLaw} isExactMatch={isExactMatch} /></div>
              </div>
            ))}
            {totalCount > 20 && (
              <nav className="mt-4 pb-5 d-flex justify-content-center"><ul className="pagination"><li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => handleSearch(currentPage - 1)}>&lt;</button></li><li className="page-item active"><button className="page-link">{currentPage}</button></li><li className="page-item"><button className="page-link" onClick={() => handleSearch(currentPage + 1)}>&gt;</button></li></ul></nav>
            )}
          </div>
        )}
        
        {view === 'reader' && !loading && currentJudgment && (
          <div id="readerView" className={`bg-white p-4 p-md-5 rounded-3 shadow-sm border mb-5 ${isTranslated ? 'translated-mode' : ''}`}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 border-bottom pb-3 gap-3">
              <button className="btn btn-outline-secondary btn-sm align-self-start align-self-md-center notranslate" onClick={handleBackToResults}><i className="fas fa-arrow-left"></i> Back</button>
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <button className={`btn btn-sm ${isTranslated ? 'btn-outline-dark' : 'btn-dark'} rounded-pill px-3 shadow-sm fw-bold notranslate`} onClick={toggleLanguage} style={{ transition: 'all 0.2s', minWidth: '130px' }}><i className={`fas ${isTranslated ? 'fa-undo' : 'fa-language'} me-2`}></i>{isTranslated ? 'Show Original' : 'বাংলায় পড়ুন'}</button>
                <button className="btn btn-sm btn-outline-warning text-dark rounded-pill px-3 notranslate" onClick={() => toggleBookmark(currentJudgment)}><i className="far fa-bookmark"></i> Save</button>
                <button className="btn btn-sm btn-outline-dark rounded-pill px-3 notranslate" onClick={() => window.print()}><i className="fas fa-print"></i> Print</button>
              </div>
            </div>
            <h3 className="fw-bold text-center text-primary mb-2 notranslate" style={{ fontFamily: 'Playfair Display' }}>{currentJudgment.title}</h3>
            <p className="text-center text-dark fw-bold mb-2 fs-5 notranslate">{currentJudgment.citation}</p>
            {parallelCitations.length > 0 && (
              <div className="text-center mb-4 notranslate"><span className="text-secondary small fw-bold text-uppercase me-2">Also Reported In:</span>{parallelCitations.map((cite, index) => <span key={index} className="badge bg-light text-secondary border me-1">{cite}</span>)}</div>
            )}
            {isTranslated && (<div className="alert alert-info py-2 small text-center mb-4 border-0 bg-light-info text-primary notranslate"><i className="fas fa-robot me-2"></i>AI Generated Translation. For reference only.</div>)}
            <div className="mt-4 judgment-content" style={{ whiteSpace: 'pre-wrap', fontFamily: 'Merriweather', textAlign: 'justify', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: judgmentText }} />
            {!judgmentText.includes("Please note that while every effort") && (<div className="mt-5 p-3 border-top border-secondary text-muted small fst-italic bg-light rounded text-center notranslate"><strong>Disclaimer:</strong> {disclaimerText}</div>)}
          </div>
        )}
        
        {view === 'home' && (
          <div id="featuresSection" className="py-5 notranslate" style={{ background: '#fff' }}>
            <div className="text-center mb-5"><h2 className="fw-bold text-dark" style={{ fontFamily: 'Playfair Display' }}>Why Choose BDKanoon?</h2><p className="text-muted">The ultimate legal companion for professionals.</p></div>
            <div className="row g-4">
              <div className="col-md-3 col-sm-6"><div className="p-4 h-100 rounded-3 border-0 shadow-sm" style={{ background: '#f8f9fa' }}><div className="mb-3 text-primary"><i className="fas fa-bolt fa-2x"></i></div><h5 className="fw-bold mb-2">Lightning Fast Search</h5><p className="text-muted small mb-0">Experience zero-latency search results powered by our optimized indexing engine.</p></div></div>
              <div className="col-md-3 col-sm-6"><div className="p-4 h-100 rounded-3 border-0 shadow-sm" style={{ background: '#f8f9fa' }}><div className="mb-3 text-primary"><i className="fas fa-book fa-2x"></i></div><h5 className="fw-bold mb-2">Comprehensive Database</h5><p className="text-muted small mb-0">Access all major laws and over 20,000+ High Court and Appellate Division judgments.</p></div></div>
              <div className="col-md-3 col-sm-6"><div className="p-4 h-100 rounded-3 border-0 shadow-sm" style={{ background: '#f8f9fa' }}><div className="mb-3 text-primary"><i className="fas fa-mobile-alt fa-2x"></i></div><h5 className="fw-bold mb-2">Mobile First Design</h5><p className="text-muted small mb-0">Fully optimized for PWA. Install it on your phone and practice law on the go.</p></div></div>
              <div className="col-md-3 col-sm-6"><div className="p-4 h-100 rounded-3 border-0 shadow-sm" style={{ background: '#f8f9fa' }}><div className="mb-3 text-primary"><i className="fas fa-headset fa-2x"></i></div><h5 className="fw-bold mb-2">Premium Support</h5><p className="text-muted small mb-0">Dedicated 24/7 technical support team ready to assist you anytime, anywhere.</p></div></div>
            </div>
          </div>
        )}
      </div>

      <div className="packages-section notranslate" id="packages">
        <div className="container">
          <div className="text-center mb-5"><h2 className="hero-title" style={{ fontSize: '32px' }}>Simple, Transparent Pricing</h2><p className="text-muted">Choose the plan that fits your practice.</p></div>
          <div className="row g-4 justify-content-center">
            <div className="col-md-3 col-sm-6"><div className="pricing-card"><div className="plan-name">Monthly</div><div className="plan-price">199৳</div><div className="plan-desc">Billed monthly</div><a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt199/4NosNL" target="_blank" rel="noreferrer" className="btn-plan">Get Started</a></div></div>
            <div className="col-md-3 col-sm-6"><div className="pricing-card popular"><div className="best-value-badge">BEST VALUE</div><div className="plan-name">Half Yearly</div><div className="plan-price">799৳</div><div className="plan-desc">Save 33%</div><a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt499/IxcDIa" target="_blank" rel="noreferrer" className="btn-plan">Get Started</a></div></div>
            <div className="col-md-3 col-sm-6"><div className="pricing-card"><div className="plan-name">Yearly</div><div className="plan-price">1200৳</div><div className="plan-desc">Save 50%</div><a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt1200/O3FBxR" target="_blank" rel="noreferrer" className="btn-plan">Get Started</a></div></div>
          </div>
          <div className="text-center mt-5"><button className="btn btn-link text-secondary text-decoration-none" onClick={() => setModalMode('payment')}>Already paid via bKash? <span className="text-primary fw-bold">Confirm Payment</span></button></div>
        </div>
      </div>

      {/* --- ADMIN MODAL (notranslate) --- */}
      {modalMode === 'adminPanel' && isAdmin && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.8)', zIndex: 1100 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
              <div className="modal-header bg-dark text-white border-0">
                <h5 className="modal-title fw-bold"><i className="fas fa-tachometer-alt me-2"></i>Admin Dashboard</h5>
                <button className="btn-close btn-close-white" onClick={() => setModalMode(null)}></button>
              </div>
              <div className="modal-body p-0">
                
                {/* --- Admin Tab Navigation --- */}
                <ul className="nav nav-tabs nav-fill bg-white border-bottom">
                    <li className="nav-item">
                        <button className={`nav-link py-3 fw-bold rounded-0 ${adminTab === 'notifications' ? 'active text-dark' : 'text-muted'}`} onClick={() => setAdminTab('notifications')}><i className="fas fa-bell me-2"></i>Notifications</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link py-3 fw-bold rounded-0 ${adminTab === 'dataEntry' ? 'active text-dark' : 'text-muted'}`} onClick={() => setAdminTab('dataEntry')}><i className="fas fa-database me-2"></i>Data Entry</button>
                    </li>
                </ul>

                <div className="p-4 bg-light">
                    {/* --- TAB 1: NOTIFICATIONS --- */}
                    {adminTab === 'notifications' && (
                        <>
                           <div className="card border-0 shadow-sm mb-4">
                               <div className="card-header bg-white fw-bold py-3 border-bottom-0 d-flex justify-content-between align-items-center">
                                   <span>{isEditing ? 'Edit Notification' : 'Create New Notification'}</span>
                                   {isEditing && <button className="btn btn-sm btn-outline-secondary" onClick={cancelEdit}>Cancel Edit</button>}
                               </div>
                               <div className="card-body">
                                  <form onSubmit={sendAdminNotification}>
                                     <div className="row">
                                        <div className="col-md-8 mb-3"><label className="form-label small text-muted text-uppercase fw-bold">Title</label><input type="text" className="form-control" value={adminTitleInput} onChange={e => setAdminTitleInput(e.target.value)} required /></div>
                                        <div className="col-md-4 mb-3"><label className="form-label small text-muted text-uppercase fw-bold">Type</label><select className="form-select" value={adminMsgType} onChange={e => setAdminMsgType(e.target.value)}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option></select></div>
                                        <div className="col-12 mb-3"><label className="form-label small text-muted text-uppercase fw-bold">Expires At</label><input type="datetime-local" className="form-control" value={adminExpiryInput} onChange={e => setAdminExpiryInput(e.target.value)} /></div>
                                        <div className="col-12 mb-3"><label className="form-label small text-muted text-uppercase fw-bold">Message</label><textarea className="form-control" rows="3" value={adminMsgInput} onChange={e => setAdminMsgInput(e.target.value)} required></textarea></div>
                                     </div>
                                     <div className="d-flex justify-content-end"><button type="submit" className={`btn px-4 ${isEditing ? 'btn-warning' : 'btn-dark'}`}>{isEditing ? 'Update' : 'Send'}</button></div>
                                  </form>
                               </div>
                           </div>
                           <h6 className="fw-bold text-secondary text-uppercase mb-3 small">Active Notifications</h6>
                           <div className="list-group">
                              {globalNotifications.map((notif) => (
                                 <div key={notif.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 border-0 mb-2 shadow-sm rounded">
                                    <div className="w-100 pe-3">
                                       <h6 className="mb-1 fw-bold">{notif.title}</h6>
                                       <p className="mb-1 text-muted small text-truncate">{notif.message}</p>
                                    </div>
                                    <div className="d-flex flex-column gap-2"><button className="btn btn-outline-dark btn-sm rounded-circle" onClick={() => handleEditClick(notif)}><i className="fas fa-edit"></i></button><button className="btn btn-outline-danger btn-sm rounded-circle" onClick={() => deleteNotification(notif.id)}><i className="fas fa-trash"></i></button></div>
                                 </div>
                              ))}
                           </div>
                        </>
                    )}

                    {/* --- TAB 2: DATA ENTRY AUTOMATION --- */}
                    {adminTab === 'dataEntry' && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white fw-bold py-3 border-bottom-0"><i className="fas fa-cloud-upload-alt me-2"></i>Upload Case</div>
                            <div className="card-body">
                                <form onSubmit={handleDataEntrySubmit}>
                                    {/* Token Input */}
                                    <div className="mb-4 p-3 bg-white border rounded">
                                        <label className="form-label small text-muted text-uppercase fw-bold">GitHub Personal Access Token (PAT)</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-white border-end-0"><i className="fas fa-key text-muted"></i></span>
                                            <input type="password" className="form-control border-start-0" placeholder="ghp_xxxxxxxxxxxx" value={githubToken} onChange={e => saveToken(e.target.value)} required />
                                        </div>
                                        <div className="form-text small">Required for file write access. Saved locally.</div>
                                    </div>

                                    {/* Metadata Fields */}
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small text-muted text-uppercase fw-bold">Case Title</label>
                                            <input type="text" className="form-control" placeholder="e.g. Rahim vs. Karim" value={entryTitle} onChange={e => setEntryTitle(e.target.value)} required />
                                        </div>
                                        
                                        <div className="col-md-8">
                                            <label className="form-label small text-muted text-uppercase fw-bold">Citations (Comma Separated)</label>
                                            <input type="text" className="form-control" placeholder="75 DLR (AD) 65, 23 ALR (AD) 43" value={entryCitations} onChange={e => setEntryCitations(e.target.value)} required />
                                            <div className="form-text small">Use format: Vol Journal (Div) Page. Ex: 75 DLR (AD) 65</div>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label small text-muted text-uppercase fw-bold">Target File</label>
                                            <input type="text" className="form-control" placeholder="75dlr_case.txt" value={entryTargetFile} onChange={e => setEntryTargetFile(e.target.value)} required />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small text-muted text-uppercase fw-bold">Headnote</label>
                                            <textarea className="form-control" rows="3" placeholder="Summary of the case..." value={entryHeadnote} onChange={e => setEntryHeadnote(e.target.value)} required></textarea>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small text-muted text-uppercase fw-bold">Full Judgment Text</label>
                                            <textarea className="form-control" rows="8" placeholder="Paste full judgment here..." value={entryFullText} onChange={e => setEntryFullText(e.target.value)} required style={{ fontFamily: 'monospace', fontSize: '13px' }}></textarea>
                                        </div>
                                    </div>

                                    <div className="d-grid mt-4">
                                        <button type="submit" className="btn btn-primary py-3 fw-bold" disabled={isUploading}>
                                            {isUploading ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</> : <><i className="fas fa-cloud-upload-alt me-2"></i>Upload to GitHub & Database</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ALL OTHER MODALS (notranslate) --- */}
      {modalMode === 'login' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
             <div className="modal-header border-0 justify-content-center position-relative py-3"><h5 className="modal-title fw-bold m-0">Welcome</h5><button className="btn-close position-absolute end-0 me-3" onClick={() => setModalMode(null)}></button></div>
              <div className="modal-body p-4 pt-3">
                <ul className="nav nav-pills nav-fill mb-3" id="pills-tab" role="tablist"><li className="nav-item" role="presentation"><button className="nav-link active" id="pills-login-tab" data-bs-toggle="pill" data-bs-target="#pills-login" type="button">Login</button></li><li className="nav-item" role="presentation"><button className="nav-link" id="pills-signup-tab" data-bs-toggle="pill" data-bs-target="#pills-signup" type="button">Sign Up</button></li></ul>
                <div className="tab-content" id="pills-tabContent">
                  <div className="tab-pane fade show active" id="pills-login"><form onSubmit={(e) => { e.preventDefault(); handleAuth(e.target.identifier.value, e.target.password.value, false); }}><div className="mb-3"><label className="form-label small text-muted">Email / Mobile</label><input name="identifier" type="text" className="form-control" required /></div><div className="mb-3"><label className="form-label small text-muted">Password</label><div className="input-group"><input name="password" type={showLoginPass ? "text" : "password"} className="form-control" required /><button type="button" className="btn btn-outline-secondary" onClick={() => setShowLoginPass(!showLoginPass)} style={{ borderLeft: '0' }}><i className={`fas ${showLoginPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button></div></div><div className="text-end mb-3"><a href="#" className="text-decoration-none small text-muted" onClick={(e) => { e.preventDefault(); const identifier = e.target.closest('form').querySelector('input[name="identifier"]').value; handlePasswordReset(identifier); }}>Forgot Password?</a></div><button className="btn btn-dark w-100 py-2">Login</button></form></div>
                  <div className="tab-pane fade" id="pills-signup"><form onSubmit={(e) => { e.preventDefault(); handleAuth(e.target.email.value, e.target.password.value, true); }}><div className="mb-3"><label className="form-label small text-muted">Email</label><input name="email" type="email" className="form-control" required /></div><div className="mb-3"><label className="form-label small text-muted">Create Password</label><div className="input-group"><input name="password" type={showSignupPass ? "text" : "password"} className="form-control" required minLength="6" /><button type="button" className="btn btn-outline-secondary" onClick={() => setShowSignupPass(!showSignupPass)} style={{ borderLeft: '0' }}><i className={`fas ${showSignupPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button></div><div className="form-text text-muted" style={{ fontSize: '12px' }}>Min 6 characters</div></div><button className="btn btn-success text-white w-100 py-2">Create Account</button></form></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'signupSuccess' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-body p-5 text-center"><div className="mb-4" style={{ width: '80px', height: '80px', background: '#28a74520', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-user-check fa-3x text-success"></i></div><h2 className="fw-bold mb-3" style={{ color: '#333' }}>Account Created!</h2><p className="text-muted mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>Your account has been created successfully.<br />Please login to continue.</p><div className="d-grid gap-2"><button className="btn btn-success rounded-pill py-3 fw-bold" onClick={() => setModalMode('login')}>Go to Login</button><button className="btn btn-light rounded-pill py-2" onClick={() => setModalMode(null)}>Close</button></div></div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'resetPassword' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Set New Password</h5></div>
              <div className="modal-body p-4"><form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword(e.target.newPass.value); }}><div className="mb-3"><label className="form-label">New Password</label><div className="input-group"><input name="newPass" type={showResetPass ? "text" : "password"} className="form-control" required minLength="6" /><button type="button" className="btn btn-outline-secondary" onClick={() => setShowResetPass(!showResetPass)} style={{ borderLeft: '0' }}><i className={`fas ${showResetPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button></div></div><button className="btn btn-primary w-100">Update Password</button></form></div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'sessionError' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-0 border-0 shadow-lg" style={{ overflow: 'hidden', borderRadius: '15px' }}>
              <div className="bg-danger py-3"><i className="fas fa-shield-alt fa-3x text-white"></i></div>
              <div className="modal-body p-5">
                <h3 className="fw-bold text-dark mb-3">Session Expired</h3>
                <p className="text-muted mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>You have logged in from another device.<br />For security reasons, this session has been terminated.</p>
                <button className="btn btn-danger rounded-pill px-5 py-2 fw-bold" onClick={() => window.location.reload()}>Login Here Again</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'profile' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content overflow-hidden p-0">
              <div className="modal-header border-0 position-relative d-flex justify-content-center align-items-center py-3 bg-dark text-white"><h5 className="modal-title fw-bold m-0">My Account</h5><button className="btn-close btn-close-white position-absolute end-0 me-3" onClick={() => setModalMode(null)}></button></div>
              <div className="modal-body text-center p-4">
                <i className="fas fa-user-circle fa-4x text-secondary mb-3"></i>
                <h5 className="fw-bold mb-1">{profileData?.email || session?.user?.email || session?.user?.phone || "Loading..."}</h5>
                <span className={`badge mb-3 ${profileData?.isPremium ? 'bg-success' : 'bg-secondary'}`}>{profileData?.isPremium ? 'Premium Member' : 'Free Member'}</span>
                {profileData && (
                  <div className="card bg-light border-0 p-3 mt-3 text-start">
                    <p className="mb-1 small text-muted text-uppercase fw-bold">Subscription Details</p>
                    {profileData.isExpired ? (<div><div className="d-flex justify-content-between border-bottom pb-2 mb-2"><span>Expiry Date:</span><span className="fw-bold text-dark">{profileData.expDate}</span></div><div className="p-3 rounded-3 border" style={{ background: '#dc354520' }}><div className="fw-bold text-danger" style={{ fontSize: '15px' }}>Date Expired</div><div className="text-danger" style={{ fontSize: '13px' }}>Please renew your subscription to continue premium access.</div></div></div>) : (<><div className="d-flex justify-content-between border-bottom pb-2 mb-2"><span>Expired on:</span><span className="fw-bold text-dark">{profileData.expDate}</span></div><div className="d-flex justify-content-between"><span>Days Remaining:</span><span className="fw-bold text-primary">{profileData.diffDays}</span></div></>)}
                  </div>
                )}
                {isAdmin && (<button className="btn btn-warning w-100 mt-3 fw-bold" onClick={() => { setModalMode('adminPanel'); }}><i className="fas fa-tools me-2"></i>Open Admin Panel</button>)}
                <button className="btn btn-outline-danger w-100 mt-4" onClick={handleLogout}>Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'app' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-5 border-0"><div className="modal-body"><i className="fas fa-mobile-alt fa-4x text-success mb-3"></i><h3 className="fw-bold">Install App</h3><p className="text-muted mt-3">To install this app:<br />1. Click browser menu (⋮ or Share icon)<br />2. Select <b>"Add to Home Screen"</b> or <b>"Install App"</b></p><button className="btn btn-light rounded-pill px-4 mt-3" onClick={() => setModalMode(null)}>Close</button></div></div>
          </div>
        </div>
      )}

      {modalMode === 'payment' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Payment Verification</h5><button className="btn-close" onClick={() => setModalMode(null)}></button></div>
              <div className="modal-body p-4"><form onSubmit={handlePaymentSubmit}><input type="hidden" name="_captcha" value="false" /><input type="hidden" name="_subject" value="New Payment" /><div className="mb-3"><label className="form-label">Name</label><input type="text" name="Name" className="form-control" required /></div><div className="mb-3"><label className="form-label">Phone</label><input type="text" name="Phone" className="form-control" required /></div><div className="mb-3"><label className="form-label">Email</label><input type="email" name="Email" className="form-control" required /></div><div className="row"><div className="col-6 mb-3"><label className="form-label">TrxID</label><input type="text" name="TrxID" className="form-control" required /></div><div className="col-6 mb-3"><label className="form-label">Plan</label><select name="Package" className="form-select"><option>Monthly</option><option>Half Yearly</option><option>Yearly</option></select></div></div><button className="btn btn-success w-100 py-2">Submit</button></form></div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'paymentSuccess' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-body p-5 text-center">
                <div className="mb-4" style={{ width: '80px', height: '80px', background: '#28a74520', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-check fa-3x text-success"></i></div>
                <h2 className="fw-bold mb-3" style={{ color: '#333' }}>Success!</h2>
                <p className="text-muted mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>Thank you! Your payment verification request has been submitted securely.</p>
                <div className="p-3 bg-light rounded mb-4 text-start"><small className="text-secondary fw-bold text-uppercase">What happens next?</small><ul className="mb-0 mt-2 ps-3 text-muted small"><li>Our team will verify your transaction ID.</li><li>Your account will be upgraded within 30 minutes.</li><li>You will receive a confirmation email shortly.</li></ul></div>
                <button className="btn btn-success rounded-pill w-100 py-3 fw-bold" onClick={() => setModalMode(null)}>Continue to Home</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'warning' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-body p-5 text-center">
                <div className="mb-4" style={{ width: '86px', height: '86px', background: '#0d6efd20', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-lock fa-3x text-primary"></i></div>
                <h3 className="fw-bold mb-2" style={{ color: '#222' }}>Premium Content</h3>
                <p className="text-muted mb-4" style={{ fontSize: '15px', lineHeight: '1.7' }}>This judgment is available for <b>Premium Members</b> only.<br />Please login or upgrade to access the full text.</p>
                <div className="d-grid gap-2"><button className="btn btn-dark rounded-pill py-3 fw-bold" onClick={() => setModalMode('login')}>Login</button><a href="#packages" className="btn btn-primary rounded-pill py-3 fw-bold" onClick={() => setModalMode(null)}>View Plans</a><button className="btn btn-light rounded-pill py-2" onClick={() => setModalMode(null)}>Not Now</button></div>
                <div className="mt-3 small text-muted">Mobile-friendly • Clean design • Secure access</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'gate' && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-5 border-0 shadow">
              <div className="modal-body">
                <i className="fas fa-check-circle fa-4x text-success mb-4"></i>
                <h3 className="fw-bold text-dark">Judgment Found!</h3>
                <p className="text-muted mt-3 mb-4">Great news! The case is in our database.<br />However, <b>Advanced Search</b> is a <b>Premium Feature</b>.</p>
                <div className="d-grid gap-2"><a href="#packages" className="btn btn-dark" onClick={() => setModalMode(null)}>View Plans</a><button className="btn btn-outline-secondary" onClick={() => setModalMode(null)}>Close</button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Added 'notranslate' */}
      <footer className="bg-dark text-secondary py-5 text-center notranslate"><div className="container"><h4 className="text-white fw-bold mb-4">BDKanoon</h4><div className="mb-4"><a href="#" className="footer-link">Home</a><a href="#packages" className="footer-link">Pricing</a><a href="#" className="footer-link">Privacy Policy</a></div><p className="mb-1">Supreme Court, Dhaka.</p><p className="mb-1">Email: bdkanoon@gmail.com</p><p className="mb-4">Phone: 01911 008 518</p><p className="small opacity-50">&copy; 2026 BDKanoon. All rights reserved.</p></div></footer>
      <a href="https://wa.me/8801911008518" className="whatsapp-float" target="_blank" rel="noreferrer"><i className="fab fa-whatsapp"></i></a>

      {notice && (
        <div className="modal d-block notranslate" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '18px', overflow: 'hidden' }}>
              <div className="modal-body p-5 text-center"><div className="mb-3">{noticeIcon(notice.type)}</div><h4 className="fw-bold mb-2" style={{ color: '#222' }}>{notice.title}</h4><p className="text-muted mb-4" style={{ fontSize: '15px', lineHeight: '1.7' }}>{notice.message}</p><div className="d-grid gap-2"><button className={`btn rounded-pill py-2 fw-bold ${notice.type === 'error' ? 'btn-danger' : notice.type === 'warning' ? 'btn-warning' : notice.type === 'success' ? 'btn-success' : 'btn-primary'}`} onClick={() => { if (notice.onPrimary) notice.onPrimary(); else closeNotice(); }}>{notice.primaryText || 'OK'}</button>{(notice.secondaryText) && (<button className="btn btn-light rounded-pill py-2" onClick={() => { if (notice.onSecondary) notice.onSecondary(); else closeNotice(); }}>{notice.secondaryText}</button>)}</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ WRAPPER COMPONENT: This ensures Error Boundary catches errors in the main App logic
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
