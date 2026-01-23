import React, { useState, useEffect } from 'react';
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
  const [advFields, setAdvFields] = useState({ journal: '', vol: '', div: '', page: '' });

  // Reader State
  const [currentJudgment, setCurrentJudgment] = useState(null);
  const [judgmentText, setJudgmentText] = useState('');
  const [parallelCitations, setParallelCitations] = useState([]);

  // Modals Control
  const [modalMode, setModalMode] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // Password visibility (Professional eye icon)
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);

  // Modern UX Notification Modal (replaces browser alert)
  const [notice, setNotice] = useState(null);
  // notice shape: { type: 'success'|'error'|'info'|'warning', title: string, message: string, primaryText?:string, onPrimary?:()=>void, secondaryText?:string, onSecondary?:()=>void }

  const openNotice = (payload) => setNotice(payload);
  const closeNotice = () => setNotice(null);

  // --- Helper: hard local signout (for stubborn sessions) ---
  const hardClearAuthStorage = () => {
    try {
      const keys = Object.keys(localStorage || {});
      keys.forEach((k) => {
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) { }
    try {
      const skeys = Object.keys(sessionStorage || {});
      skeys.forEach((k) => {
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
          sessionStorage.removeItem(k);
        }
      });
    } catch (e) { }
  };

  const forceSignOut = async ({ title, message }) => {
    try { await supabase.auth.signOut(); } catch (e) { }
    hardClearAuthStorage();
    setSession(null);
    setSubStatus(false);
    setProfileData(null);
    setModalMode('login');
    openNotice({
      type: 'warning',
      title: title || 'Signed Out',
      message: message || 'Your session has ended.',
      primaryText: 'OK',
      onPrimary: closeNotice
    });
  };

  // =========================
  // ✅ NEW HELPERS: Email/Mobile detection + phone normalization
  // =========================
  const looksLikeEmail = (v) => {
    const s = (v || '').trim();
    return s.includes('@');
  };

  const normalizePhoneCandidates = (raw) => {
    let s = (raw || '').trim();
    // keep digits and plus
    s = s.replace(/[^\d+]/g, '');
    if (!s) return [];

    // Convert 00 prefix to +
    if (s.startsWith('00')) s = '+' + s.slice(2);

    const candidates = new Set();
    candidates.add(s);

    // Bangladesh common: 01XXXXXXXXX
    if (/^01\d{9}$/.test(s)) {
      candidates.add('+88' + s);     // +8801...
      candidates.add('88' + s);      // 8801...
      candidates.add(s);             // 01...
    }

    // If 8801...
    if (/^8801\d{9}$/.test(s)) {
      candidates.add('+' + s);       // +8801...
      candidates.add(s);             // 8801...
      candidates.add(s.replace(/^88/, '')); // 01...
    }

    // If +8801...
    if (/^\+8801\d{9}$/.test(s)) {
      candidates.add(s);             // +8801...
      candidates.add(s.replace(/^\+/, '')); // 8801...
      candidates.add(s.replace(/^\+88/, '')); // 01...
    }

    // If user types just digits without + but country included
    if (/^880\d{10}$/.test(s)) {
      candidates.add('+' + s);
    }

    return Array.from(candidates);
  };

  const parseLoginIdentifier = (input) => {
    const v = (input || '').trim();
    if (looksLikeEmail(v)) return { type: 'email', value: v.toLowerCase() };
    return { type: 'phone', value: v };
  };

  // --- Helper: safe member fetch (id -> email -> phone/mobile fallback) ---
  const fetchMemberRow = async (user) => {
    if (!user) return { data: null, error: null };

    // 1) Try by ID (works when members.id is UUID = auth.users.id)
    try {
      const resById = await supabase
        .from('members')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (resById?.data) return resById;
    } catch (e) { }

    // 2) Try by Email
    if (user.email) {
      try {
        const resByEmailOrdered = await supabase
          .from('members')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (resByEmailOrdered?.data) return resByEmailOrdered;
      } catch (e) { }
    }

    // 3) Try by Phone (Supabase auth user may have user.phone)
    const phoneVal = user.phone || null;
    if (phoneVal) {
      const candidates = normalizePhoneCandidates(phoneVal);
      const phoneColumnsToTry = ['phone', 'mobile', 'mobile_number', 'phone_number'];

      for (const col of phoneColumnsToTry) {
        try {
          const res = await supabase
            .from('members')
            .select('*')
            .in(col, candidates)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (res?.data) return res;
        } catch (e) {
          // column might not exist / RLS etc -> ignore & try next
        }
      }
    }

    return { data: null, error: null };
  };

  // =========================
  // Disable copy / selection (print allowed)
  // =========================
  useEffect(() => {
    const styleId = 'no-copy-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        body.nocopy, body.nocopy *{
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        body.nocopy input, body.nocopy textarea, body.nocopy [contenteditable="true"]{
          -webkit-user-select: text !important;
          user-select: text !important;
        }
        @media print{
          body.nocopy, body.nocopy *{
            -webkit-user-select: text !important;
            user-select: text !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.classList.add('nocopy');

    const isEditableTarget = (t) => {
      if (!t) return false;
      const tag = (t.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;
      if (t.isContentEditable) return true;
      return false;
    };

    const onCopy = (e) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      openNotice({
        type: 'warning',
        title: 'Copy Disabled',
        message: 'For content protection, copying is disabled. You can use the Print button to print this judgment.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    };

    const onCut = (e) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };

    const onContextMenu = (e) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      openNotice({
        type: 'info',
        title: 'Protected Content',
        message: 'Right-click is disabled to protect content. Use the Print option if needed.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    };

    const onKeyDown = (e) => {
      const key = (e.key || '').toLowerCase();
      const isCtrl = e.ctrlKey || e.metaKey;

      if (!isCtrl) return;

      if (key === 'p') return; // allow print
      if (isEditableTarget(e.target)) return;

      if (key === 'c' || key === 'x' || key === 'a' || key === 's') {
        e.preventDefault();
        if (key === 'c') {
          openNotice({
            type: 'warning',
            title: 'Copy Disabled',
            message: 'Copying is disabled. Please use Print if you need a hard copy.',
            primaryText: 'OK',
            onPrimary: closeNotice
          });
        }
      }
    };

    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // --- Auth & Session Lock Effects ---
  useEffect(() => {
    let sessionInterval;
    let isMounted = true;

    const initSession = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const current = data?.session || null;

        if (isMounted) {
          setSession(current);
          setLoading(false);

          if (current) {
            Promise.resolve().then(() => checkSubscription(current.user)).catch(() => { });
            Promise.resolve().then(() => updateSessionInDB(current)).catch(() => { });

            if (sessionInterval) clearInterval(sessionInterval);
            sessionInterval = startSessionMonitor(current);
          } else {
            setSubStatus(false);
            setProfileData(null);
            if (sessionInterval) clearInterval(sessionInterval);
          }
        }
      } catch (error) {
        console.error("Session Init Error:", error);
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setSession(session);
      setLoading(false);

      if (event === 'PASSWORD_RECOVERY') {
        setModalMode('resetPassword');
      }

      if (session) {
        Promise.resolve().then(() => checkSubscription(session.user)).catch(() => { });

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          Promise.resolve().then(() => updateSessionInDB(session)).catch(() => { });
          if (sessionInterval) clearInterval(sessionInterval);
          sessionInterval = startSessionMonitor(session);
        }
      } else {
        setSubStatus(false);
        setProfileData(null);
        if (sessionInterval) clearInterval(sessionInterval);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (sessionInterval) clearInterval(sessionInterval);
    };
  }, []);

  const updateSessionInDB = async (currentSession) => {
    if (!currentSession?.user) return;

    const token = currentSession.access_token;
    const user = currentSession.user;

    try {
      // 1) by id
      const res1 = await supabase
        .from('members')
        .update({ current_session_id: token })
        .eq('id', user.id);

      if (!res1?.error) return;

      // 2) by email
      if (user.email) {
        const res2 = await supabase
          .from('members')
          .update({ current_session_id: token })
          .eq('email', user.email);

        if (!res2?.error) return;
      }

      // 3) by phone/mobile
      const phoneVal = user.phone || null;
      if (phoneVal) {
        const candidates = normalizePhoneCandidates(phoneVal);
        const phoneColumnsToTry = ['phone', 'mobile', 'mobile_number', 'phone_number'];

        for (const col of phoneColumnsToTry) {
          try {
            const res3 = await supabase
              .from('members')
              .update({ current_session_id: token })
              .in(col, candidates);

            if (!res3?.error) return;
          } catch (e) { }
        }
      }
    } catch (err) {
      console.error("Session sync failed", err);
    }
  };

  const startSessionMonitor = (currentSession) => {
    return setInterval(async () => {
      if (!currentSession?.user) return;

      const user = currentSession.user;

      try {
        // A) If user deleted from members table -> auto sign out
        const { data: memberRow } = await fetchMemberRow(user);
        if (!memberRow) {
          await forceSignOut({
            title: 'Account Removed',
            message: 'Your account is no longer registered. Please sign up again to continue.'
          });
          return;
        }

        // B) Single-session enforcement (existing logic)
        const resById = await supabase
          .from('members')
          .select('current_session_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!resById?.error && resById?.data) {
          if (resById.data.current_session_id && resById.data.current_session_id !== currentSession.access_token) {
            await supabase.auth.signOut();
            hardClearAuthStorage();
            setSession(null);
            setSubStatus(false);
            setModalMode('sessionError');
          }
          return;
        }

        // fallback: by email
        if (user.email) {
          const resByEmail = await supabase
            .from('members')
            .select('current_session_id')
            .eq('email', user.email)
            .maybeSingle();

          if (!resByEmail?.error && resByEmail?.data) {
            if (resByEmail.data.current_session_id && resByEmail.data.current_session_id !== currentSession.access_token) {
              await supabase.auth.signOut();
              hardClearAuthStorage();
              setSession(null);
              setSubStatus(false);
              setModalMode('sessionError');
            }
            return;
          }
        }

        // fallback: by phone/mobile (best effort)
        const phoneVal = user.phone || null;
        if (phoneVal) {
          const candidates = normalizePhoneCandidates(phoneVal);
          const phoneColumnsToTry = ['phone', 'mobile', 'mobile_number', 'phone_number'];

          for (const col of phoneColumnsToTry) {
            try {
              const resByPhone = await supabase
                .from('members')
                .select('current_session_id')
                .in(col, candidates)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (!resByPhone?.error && resByPhone?.data) {
                if (resByPhone.data.current_session_id && resByPhone.data.current_session_id !== currentSession.access_token) {
                  await supabase.auth.signOut();
                  hardClearAuthStorage();
                  setSession(null);
                  setSubStatus(false);
                  setModalMode('sessionError');
                }
                return;
              }
            } catch (e) { }
          }
        }
      } catch (e) {
        // ignore
      }
    }, 5000);
  };

  const checkSubscription = async (user) => {
    if (!user) return;

    try {
      const { data } = await fetchMemberRow(user);

      // If not registered in members, sign out
      if (!data) {
        await forceSignOut({
          title: 'Not Registered',
          message: 'Please sign up. This account is not registered.'
        });
        return;
      }

      if (data.expiry_date) {
        const expDate = new Date(data.expiry_date);
        const today = new Date();

        if (isNaN(expDate.getTime())) {
          setSubStatus(false);
          setProfileData({ ...data, isPremium: false, diffDays: 0, expDate: 'N/A', isExpired: true });
          return;
        }

        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isPremium = diffDays >= 0;
        const isExpired = diffDays < 0;

        setSubStatus(isPremium);
        setProfileData({
          ...data,
          isPremium,
          diffDays: diffDays > 0 ? diffDays : 0,
          expDate: expDate.toDateString(),
          isExpired
        });
      } else {
        const displayId = data.email || data.phone || data.mobile || user.email || user.phone || 'Account';
        setSubStatus(false);
        setProfileData({ ...data, email: displayId, isPremium: false, diffDays: 0, expDate: 'Free Plan', isExpired: false });
      }
    } catch (e) {
      const displayId = user.email || user.phone || 'Account';
      setSubStatus(false);
      setProfileData({ email: displayId, isPremium: false, diffDays: 0, expDate: 'N/A', isExpired: false });
    }
  };

  const handleSearch = async (page = 1, type = 'simple') => {
    setLoading(true);
    setCurrentPage(page);
    setView('results');

    try {
      let queryBuilder = supabase.from('cases').select('*', { count: 'exact' });

      if (type === 'advanced') {
        const { journal, vol, div, page: pg } = advFields;
        if (!journal || !vol || !div || !pg) {
          openNotice({
            type: 'warning',
            title: 'Missing Fields',
            message: 'Please fill all citation fields to perform Advanced Search.',
            primaryText: 'OK',
            onPrimary: closeNotice
          });
          setLoading(false);
          return;
        }
        queryBuilder = queryBuilder.eq('journal', journal).eq('volume', vol).eq('division', div).eq('page_number', pg);
      } else {
        let aliasCondition = "";
        if (selectedLaw) {
          const aliases = lawAliases[selectedLaw] || [selectedLaw];
          const headnoteChecks = aliases.map(a => `headnote.ilike.%${a}%`).join(',');
          const titleChecks = aliases.map(a => `title.ilike.%${a}%`).join(',');
          aliasCondition = headnoteChecks + ',' + titleChecks;
        }

        const safeSearchTerm = searchTerm.replace(/[^\w\s\u0980-\u09FF-]/g, "");

        if (isExactMatch) {
          const queryStr = `headnote.ilike.%${safeSearchTerm}%,title.ilike.%${safeSearchTerm}%`;
          if (aliasCondition) queryBuilder = queryBuilder.or(aliasCondition + ',' + queryStr);
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

          if (aliasCondition && textCondition) queryBuilder = queryBuilder.or(aliasCondition + ',' + textCondition);
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

      if (data) {
        setResults(data);
        setTotalCount(count || 0);
      } else if (error) {
        console.error("Search Error:", error);
        openNotice({
          type: 'error',
          title: 'Search Failed',
          message: 'Something went wrong while searching. Please try again.',
          primaryText: 'OK',
          onPrimary: closeNotice
        });
      }
    } catch (e) {
      console.error("Search Exception:", e);
      openNotice({
        type: 'error',
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJudgment = async (item) => {
    if (item.is_premium && !session) { setModalMode('warning'); return; }
    if (item.is_premium && !subStatus) { setModalMode('warning'); return; }

    setLoading(true);
    setView('reader');
    setCurrentJudgment(item);
    setParallelCitations([]);

    try {
      const url = `https://raw.githubusercontent.com/${githubUser}/${repoName}/main/judgments/${item.github_filename}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("File not found");

      const fullText = await res.text();

      const anchorStr = `===${item.case_anchor}===`;
      const anchorIdx = fullText.indexOf(anchorStr);

      if (anchorIdx === -1) { throw new Error("Case anchor not found in file."); }

      const endMarker = "===End===";
      const endIdx = fullText.indexOf(endMarker, anchorIdx);
      if (endIdx === -1) { throw new Error("End marker not found for this case."); }

      const previousEndIdx = fullText.lastIndexOf(endMarker, anchorIdx);
      let blockStart = 0;
      if (previousEndIdx !== -1) { blockStart = previousEndIdx + endMarker.length; }

      let caseContent = fullText.substring(blockStart, endIdx).trim();

      const matches = [];
      while (true) {
        const headerRegex = /^\s*(===(.*?)===)/;
        const match = headerRegex.exec(caseContent);
        if (match) {
          const citeText = match[2].trim();
          if (!matches.includes(citeText)) { matches.push(citeText); }
          caseContent = caseContent.replace(match[1], '').trimStart();
        } else { break; }
      }

      setParallelCitations(matches);
      setJudgmentText(caseContent);

    } catch (e) {
      setJudgmentText("Error loading judgment text: " + e.message);
      setParallelCitations([]);
      openNotice({
        type: 'error',
        title: 'Failed to Load',
        message: 'Judgment text could not be loaded. Please try again.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Login supports Email or Mobile; no false "Not Registered" pre-check
  const handleAuth = async (identifierInput, password, isSignUp) => {
    setLoading(true);

    if (isSignUp) {
      // (Keeping signup as email-based as your original)
      const email = (identifierInput || '').trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        openNotice({
          type: 'error',
          title: 'Sign Up Failed',
          message: error.message,
          primaryText: 'OK',
          onPrimary: closeNotice
        });
        setLoading(false);
        return;
      }

      // Try to register user into members table (best-effort)
      try {
        const newUser = data?.user;
        if (newUser?.id) {
          await supabase.from('members').insert([{
            id: newUser.id,
            email,
            expiry_date: null
          }]);
        } else {
          await supabase.from('members').insert([{ email, expiry_date: null }]);
        }
      } catch (e) { }

      // Ensure user is NOT kept signed-in locally after signup
      try { await supabase.auth.signOut(); } catch (e) { }
      hardClearAuthStorage();

      setSession(null);
      setSubStatus(false);
      setProfileData(null);

      setModalMode('signupSuccess');
      setLoading(false);
      return;
    } else {
      const parsed = parseLoginIdentifier(identifierInput);

      // 1) Attempt Supabase auth FIRST (prevents false "Not registered")
      let authRes;
      try {
        if (parsed.type === 'email') {
          authRes = await supabase.auth.signInWithPassword({ email: parsed.value, password });
        } else {
          // phone login
          // Try multiple candidate formats for best success
          const candidates = normalizePhoneCandidates(parsed.value);
          let success = null;
          let lastErr = null;

          for (const p of candidates) {
            const r = await supabase.auth.signInWithPassword({ phone: p, password });
            if (!r?.error && (r?.data?.session || r?.data?.user)) {
              success = r;
              break;
            }
            lastErr = r?.error || lastErr;
          }

          authRes = success || { data: null, error: lastErr || { message: 'Login failed.' } };
        }
      } catch (e) {
        authRes = { data: null, error: e };
      }

      if (authRes?.error) {
        openNotice({
          type: 'error',
          title: 'Wrong Email/Mobile or Password',
          message: 'The information you entered is incorrect. Please try again.',
          primaryText: 'OK',
          onPrimary: closeNotice
        });
        setLoading(false);
        return;
      }

      // 2) After successful auth, confirm still registered in members (admin may have deleted)
      try {
        const u = authRes?.data?.user || authRes?.data?.session?.user;
        if (u) {
          const { data: memberRow } = await fetchMemberRow(u);
          if (!memberRow) {
            await forceSignOut({
              title: 'Not Registered',
              message: 'Please sign up. This account is not registered.'
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) { }
    }

    setLoading(false);
    setModalMode(null);
  };

  const handlePasswordReset = async (identifierInput) => {
    const raw = (identifierInput || '').trim();
    if (!raw) {
      openNotice({
        type: 'warning',
        title: 'Email Required',
        message: 'Please enter your email address first.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
      return;
    }

    if (!looksLikeEmail(raw)) {
      openNotice({
        type: 'info',
        title: 'Reset by Email',
        message: 'Password reset link is sent by email. Please enter your registered email to reset password.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(raw.toLowerCase(), { redirectTo: siteLink });
    if (error) {
      openNotice({
        type: 'error',
        title: 'Reset Failed',
        message: error.message,
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    } else {
      openNotice({
        type: 'success',
        title: 'Reset Link Sent',
        message: 'We have sent a password reset link to your email. Please check your inbox (and spam folder).',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (newPassword) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      openNotice({
        type: 'error',
        title: 'Update Failed',
        message: "Error: " + error.message,
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    } else {
      openNotice({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been updated successfully. Please login again.',
        primaryText: 'Go to Login',
        onPrimary: () => { closeNotice(); setModalMode('login'); },
        secondaryText: 'Close',
        onSecondary: closeNotice
      });
      setModalMode(null);
      window.location.hash = '';
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      try { await supabase.auth.signOut(); } catch (e) { }
      hardClearAuthStorage();

      setSession(null);
      setSubStatus(false);
      setProfileData(null);
      setModalMode(null);
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  const toggleBookmark = async (item) => {
    if (!session) { setModalMode('login'); return; }

    const identity = session.user.email || session.user.phone || 'unknown';
    const { error } = await supabase.from('bookmarks').insert([{
      email: identity,
      case_title: item.title,
      case_citation: item.citation,
      case_anchor: item.case_anchor,
      github_filename: item.github_filename
    }]);

    if (error) {
      openNotice({
        type: 'warning',
        title: 'Not Saved',
        message: 'Already saved or an error occurred.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    } else {
      openNotice({
        type: 'success',
        title: 'Saved',
        message: 'Bookmark saved successfully.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    }
  };

  const fetchBookmarks = async () => {
    if (!session) { setModalMode('login'); return; }
    setLoading(true);

    const identity = session.user.email || session.user.phone || 'unknown';
    const { data } = await supabase.from('bookmarks').select('*').eq('email', identity);

    setLoading(false);
    if (data) {
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
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        setModalMode('paymentSuccess');
        form.reset();
      } else {
        openNotice({
          type: 'error',
          title: 'Submission Failed',
          message: 'There was a problem submitting your form. Please try again.',
          primaryText: 'OK',
          onPrimary: closeNotice
        });
      }
    } catch (error) {
      openNotice({
        type: 'error',
        title: 'Network Error',
        message: 'Error sending form. Please try again.',
        primaryText: 'OK',
        onPrimary: closeNotice
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !session && view === 'home' && !results.length) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Notice modal theming
  const noticeIcon = (type) => {
    if (type === 'success') return <i className="fas fa-check-circle fa-3x text-success"></i>;
    if (type === 'error') return <i className="fas fa-times-circle fa-3x text-danger"></i>;
    if (type === 'warning') return <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>;
    return <i className="fas fa-info-circle fa-3x text-primary"></i>;
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg fixed-top">
        <div className="container">
          <a className="navbar-brand" href="#" onClick={() => window.location.reload()}>BD<span>Kanoon</span></a>
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <i className="fas fa-bars"></i>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><a className="nav-link nav-link-close" href="#" onClick={() => { setView('home'); setResults([]); }}>Home</a></li>
              <li className="nav-item"><a className="nav-link nav-link-close" href="#" onClick={fetchBookmarks}>Bookmarks</a></li>
              <li className="nav-item"><a className="nav-link nav-link-close" href="#packages">Pricing</a></li>
              <li className="nav-item">
                <button className="btn-app ms-lg-3 mt-3 mt-lg-0 border-0" onClick={() => setModalMode('app')}>
                  <i className="fab fa-android"></i> Get App
                </button>
              </li>
              <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
                {session ? (
                  <button className="btn btn-outline-dark rounded-pill px-3 btn-sm" onClick={() => setModalMode('profile')}>
                    <i className="fas fa-user-circle"></i> Account
                  </button>
                ) : (
                  <button className="btn btn-dark rounded-pill px-4 btn-sm" onClick={() => setModalMode('login')}>
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
                <input className="law-input" list="lawList" placeholder="Select Law..." onChange={(e) => setSelectedLaw(e.target.value)} />
                <datalist id="lawList">
                  {Object.keys(lawAliases).map(law => <option key={law} value={law} />)}
                </datalist>
              </div>
              <input
                type="text" className="main-input"
                placeholder="Search keywords..."
                value={searchTerm}
                maxLength={50}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
              />
              <button className="btn btn-link text-secondary" onClick={() => setShowAdvSearch(!showAdvSearch)}><i className="fas fa-sliders-h"></i></button>
              <button className="btn-search-hero" onClick={() => handleSearch(1)}><i className="fas fa-arrow-right"></i></button>
            </div>

            <div className="d-flex justify-content-center gap-3 mt-3">
              <label className="small text-secondary d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                <input type="checkbox" onChange={(e) => setIsExactMatch(e.target.checked)} /> Exact Phrase Match
              </label>
            </div>

            {showAdvSearch && (
              <div className="adv-search-panel" style={{ display: 'block' }}>
                <h6 className="small fw-bold text-uppercase text-secondary mb-3">Citation Search</h6>
                <div className="row g-2">
                  <div className="col-6 col-md-3"><select className="form-select form-select-sm" onChange={e => setAdvFields({ ...advFields, journal: e.target.value })}><option value="">Journal</option><option>ADC</option> <option>ALR</option> <option>BLC</option> <option>BLD</option> <option>BLT</option> <option>CLR</option><option>DLR</option> <option>LM</option> <option>MLR</option> <option>SCOB</option></select></div>
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

      {/* Main Content Area */}
      <div className="container" style={{ minHeight: '400px' }}>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

        {/* Results View */}
        {view === 'results' && !loading && (
          <div id="resultsArea">
            <p className="text-muted small mb-3">Found {totalCount} results</p>
            {results.length === 0 && <div className="text-center mt-5 text-muted"><h5>No cases found.</h5></div>}
            {results.map(item => (
              <div key={item.id} className="result-item" onClick={() => loadJudgment(item)}>
                <h5>{item.title}</h5>
                <div className="mb-2">
                  {(session && subStatus) ?
                    <><span className="badge bg-light text-dark border">{item.citation}</span> <span className="text-muted small ms-2">{item.division}</span></> :
                    <span className="badge bg-secondary text-white"><i className="fas fa-lock"></i> Premium</span>
                  }
                </div>
                <div className="headnote-text" style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                  <HighlightedText text={item.headnote || ""} highlight={searchTerm || selectedLaw} />
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalCount > 20 && (
              <nav className="mt-4 pb-5 d-flex justify-content-center">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => handleSearch(currentPage - 1)}>&lt;</button></li>
                  <li className="page-item active"><button className="page-link">{currentPage}</button></li>
                  <li className="page-item"><button className="page-link" onClick={() => handleSearch(currentPage + 1)}>&gt;</button></li>
                </ul>
              </nav>
            )}
          </div>
        )}

        {/* Reader View */}
        {view === 'reader' && !loading && currentJudgment && (
          <div id="readerView" className="bg-white p-4 p-md-5 rounded-3 shadow-sm border mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setView('results')}><i className="fas fa-arrow-left"></i> Back</button>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-warning text-dark" onClick={() => toggleBookmark(currentJudgment)}><i className="far fa-bookmark"></i> Save</button>
                <button className="btn btn-sm btn-outline-dark" onClick={() => window.print()}><i className="fas fa-print"></i> Print</button>
              </div>
            </div>

            <h3 className="fw-bold text-center text-primary mb-2" style={{ fontFamily: 'Playfair Display' }}>{currentJudgment.title}</h3>
            <p className="text-center text-dark fw-bold mb-2 fs-5">{currentJudgment.citation}</p>

            {parallelCitations.length > 0 && (
              <div className="text-center mb-4">
                <span className="text-secondary small fw-bold text-uppercase me-2">Also Reported In:</span>
                {parallelCitations.map((cite, index) => (
                  <span key={index} className="badge bg-light text-secondary border me-1">{cite}</span>
                ))}
              </div>
            )}

            <div className="mt-4 text-justify" style={{ whiteSpace: 'pre-wrap', fontFamily: 'Merriweather', textAlign: 'justify' }}>
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
            <h2 className="hero-title" style={{ fontSize: '32px' }}>Simple, Transparent Pricing</h2>
            <p className="text-muted">Choose the plan that fits your practice.</p>
          </div>
          <div className="row g-4 justify-content-center">
            <div className="col-md-3 col-sm-6">
              <div className="pricing-card">
                <div className="plan-name">Monthly</div>
                <div className="plan-price">199৳</div>
                <div className="plan-desc">Billed monthly</div>
                <a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt199/4NosNL" target="_blank" rel="noreferrer" className="btn-plan">Get Started</a>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="pricing-card popular">
                <div className="best-value-badge">BEST VALUE</div>
                <div className="plan-name">Half Yearly</div>
                <div className="plan-price">799৳</div>
                <div className="plan-desc">Save 33%</div>
                <a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt499/IxcDIa" target="_blank" rel="noreferrer" className="btn-plan">Get Started</a>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="pricing-card">
                <div className="plan-name">Yearly</div>
                <div className="plan-price">1200৳</div>
                <div className="plan-desc">Save 50%</div>
                <a href="https://shop.bkash.com/ak-jurist-law-firm01911008518/pay/bdt1200/O3FBxR" target="_blank" rel="noreferrer" className="btn-plan">Get Started</a>
              </div>
            </div>
          </div>
          <div className="text-center mt-5">
            <button className="btn btn-link text-secondary text-decoration-none" onClick={() => setModalMode('payment')}>
              Already paid via bKash? <span className="text-primary fw-bold">Confirm Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {modalMode === 'login' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 justify-content-center position-relative py-3">
                <h5 className="modal-title fw-bold m-0">Welcome</h5>
                <button className="btn-close position-absolute end-0 me-3" onClick={() => setModalMode(null)}></button>
              </div>

              <div className="modal-body p-4 pt-3">
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
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleAuth(e.target.identifier.value, e.target.password.value, false);
                    }}>
                      <div className="mb-3">
                        <label className="form-label small text-muted">Email / Mobile</label>
                        <input name="identifier" type="text" className="form-control" required />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small text-muted">Password</label>
                        <div className="input-group">
                          <input name="password" type={showLoginPass ? "text" : "password"} className="form-control" required />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowLoginPass(!showLoginPass)}
                            aria-label="Toggle password visibility"
                            style={{ borderLeft: '0' }}
                          >
                            <i className={`fas ${showLoginPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                      </div>

                      <div className="text-end mb-3">
                        <a href="#" className="text-decoration-none small text-muted" onClick={(e) => {
                          e.preventDefault();
                          const identifier = e.target.closest('form').querySelector('input[name="identifier"]').value;
                          handlePasswordReset(identifier);
                        }}>Forgot Password?</a>
                      </div>
                      <button className="btn btn-dark w-100 py-2">Login</button>
                    </form>
                  </div>

                  {/* Sign Up */}
                  <div className="tab-pane fade" id="pills-signup">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleAuth(e.target.email.value, e.target.password.value, true);
                    }}>
                      <div className="mb-3">
                        <label className="form-label small text-muted">Email</label>
                        <input name="email" type="email" className="form-control" required />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small text-muted">Create Password</label>
                        <div className="input-group">
                          <input name="password" type={showSignupPass ? "text" : "password"} className="form-control" required minLength="6" />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowSignupPass(!showSignupPass)}
                            aria-label="Toggle password visibility"
                            style={{ borderLeft: '0' }}
                          >
                            <i className={`fas ${showSignupPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        <div className="form-text text-muted" style={{ fontSize: '12px' }}>Min 6 characters</div>
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

      {modalMode === 'signupSuccess' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-body p-5 text-center">
                <div className="mb-4" style={{ width: '80px', height: '80px', background: '#28a74520', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-user-check fa-3x text-success"></i>
                </div>
                <h2 className="fw-bold mb-3" style={{ color: '#333' }}>Account Created!</h2>
                <p className="text-muted mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>
                  Your account has been created successfully.<br />
                  Please login to continue.
                </p>
                <div className="d-grid gap-2">
                  <button className="btn btn-success rounded-pill py-3 fw-bold" onClick={() => setModalMode('login')}>
                    Go to Login
                  </button>
                  <button className="btn btn-light rounded-pill py-2" onClick={() => setModalMode(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'resetPassword' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Set New Password</h5></div>
              <div className="modal-body p-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdatePassword(e.target.newPass.value);
                }}>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <div className="input-group">
                      <input name="newPass" type={showResetPass ? "text" : "password"} className="form-control" required minLength="6" />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowResetPass(!showResetPass)}
                        aria-label="Toggle password visibility"
                        style={{ borderLeft: '0' }}
                      >
                        <i className={`fas ${showResetPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <button className="btn btn-primary w-100">Update Password</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'sessionError' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-0 border-0 shadow-lg" style={{ overflow: 'hidden', borderRadius: '15px' }}>
              <div className="bg-danger py-3">
                <i className="fas fa-shield-alt fa-3x text-white"></i>
              </div>
              <div className="modal-body p-5">
                <h3 className="fw-bold text-dark mb-3">Session Expired</h3>
                <p className="text-muted mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>
                  You have logged in from another device.<br />
                  For security reasons, this session has been terminated.
                </p>
                <button className="btn btn-danger rounded-pill px-5 py-2 fw-bold" onClick={() => window.location.reload()}>
                  Login Here Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'profile' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content overflow-hidden p-0">
              <div className="modal-header border-0 position-relative d-flex justify-content-center align-items-center py-3 bg-dark text-white">
                <h5 className="modal-title fw-bold m-0">My Account</h5>
                <button className="btn-close btn-close-white position-absolute end-0 me-3" onClick={() => setModalMode(null)}></button>
              </div>
              <div className="modal-body text-center p-4">
                <i className="fas fa-user-circle fa-4x text-secondary mb-3"></i>
                <h5 className="fw-bold mb-1">{profileData?.email || session?.user?.email || session?.user?.phone || "Loading..."}</h5>
                <span className={`badge mb-3 ${profileData?.isPremium ? 'bg-success' : 'bg-secondary'}`}>
                  {profileData?.isPremium ? 'Premium Member' : 'Free Member'}
                </span>

                {profileData && (
                  <div className="card bg-light border-0 p-3 mt-3 text-start">
                    <p className="mb-1 small text-muted text-uppercase fw-bold">Subscription Details</p>

                    {profileData.isExpired ? (
                      <div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span>Expiry Date:</span>
                          <span className="fw-bold text-dark">{profileData.expDate}</span>
                        </div>
                        <div className="p-3 rounded-3 border" style={{ background: '#dc354520' }}>
                          <div className="fw-bold text-danger" style={{ fontSize: '15px' }}>
                            Date Expired
                          </div>
                          <div className="text-danger" style={{ fontSize: '13px' }}>
                            Please renew your subscription to continue premium access.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                          <span>Expired on:</span>
                          <span className="fw-bold text-dark">{profileData.expDate}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Days Remaining:</span>
                          <span className="fw-bold text-primary">{profileData.diffDays}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button className="btn btn-outline-danger w-100 mt-4" onClick={handleLogout}>Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'app' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-5 border-0">
              <div className="modal-body">
                <i className="fas fa-android fa-4x text-success mb-3"></i>
                <h3 className="fw-bold">Coming Soon!</h3>
                <p className="text-muted mt-3">Our dedicated Android App is currently under development.</p>
                <button className="btn btn-light rounded-pill px-4 mt-3" onClick={() => setModalMode(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'payment' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Payment Verification</h5><button className="btn-close" onClick={() => setModalMode(null)}></button></div>
              <div className="modal-body p-4">
                <form onSubmit={handlePaymentSubmit}>
                  <input type="hidden" name="_captcha" value="false" /><input type="hidden" name="_subject" value="New Payment" />
                  <div className="mb-3"><label className="form-label">Name</label><input type="text" name="Name" className="form-control" required /></div>
                  <div className="mb-3"><label className="form-label">Phone</label><input type="text" name="Phone" className="form-control" required /></div>
                  <div className="mb-3"><label className="form-label">Email</label><input type="email" name="Email" className="form-control" required /></div>
                  <div className="row"><div className="col-6 mb-3"><label className="form-label">TrxID</label><input type="text" name="TrxID" className="form-control" required /></div><div className="col-6 mb-3"><label className="form-label">Plan</label><select name="Package" className="form-select"><option>Monthly</option><option>Half Yearly</option><option>Yearly</option></select></div></div>
                  <button className="btn btn-success w-100 py-2">Submit</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'paymentSuccess' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-body p-5 text-center">
                <div className="mb-4" style={{ width: '80px', height: '80px', background: '#28a74520', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-check fa-3x text-success"></i>
                </div>
                <h2 className="fw-bold mb-3" style={{ color: '#333' }}>Success!</h2>
                <p className="text-muted mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>
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
                <button className="btn btn-success rounded-pill w-100 py-3 fw-bold" onClick={() => setModalMode(null)}>
                  Continue to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'warning' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-body p-5 text-center">
                <div className="mb-4" style={{ width: '86px', height: '86px', background: '#0d6efd20', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-lock fa-3x text-primary"></i>
                </div>
                <h3 className="fw-bold mb-2" style={{ color: '#222' }}>Premium Content</h3>
                <p className="text-muted mb-4" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                  This judgment is available for <b>Premium Members</b> only.<br />
                  Please login or upgrade to access the full text.
                </p>
                <div className="d-grid gap-2">
                  <button className="btn btn-dark rounded-pill py-3 fw-bold" onClick={() => setModalMode('login')}>
                    Login
                  </button>
                  <a href="#packages" className="btn btn-primary rounded-pill py-3 fw-bold" onClick={() => setModalMode(null)}>
                    View Plans
                  </a>
                  <button className="btn btn-light rounded-pill py-2" onClick={() => setModalMode(null)}>
                    Not Now
                  </button>
                </div>
                <div className="mt-3 small text-muted">
                  Mobile-friendly • Clean design • Secure access
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'gate' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center p-5 border-0 shadow">
              <div className="modal-body">
                <i className="fas fa-check-circle fa-4x text-success mb-4"></i>
                <h3 className="fw-bold text-dark">Judgment Found!</h3>
                <p className="text-muted mt-3 mb-4">Great news! The case is in our database.<br />However, <b>Advanced Search</b> is a <b>Premium Feature</b>.</p>
                <div className="d-grid gap-2">
                  <a href="#packages" className="btn btn-dark" onClick={() => setModalMode(null)}>View Plans</a>
                  <button className="btn btn-outline-secondary" onClick={() => setModalMode(null)}>Close</button>
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
          <p className="small opacity-50">&copy; 2026 BDKanoon. All rights reserved.</p>
        </div>
      </footer>
      <a href="https://wa.me/8801911008518" className="whatsapp-float" target="_blank" rel="noreferrer"><i className="fab fa-whatsapp"></i></a>

      {/* ✅ NOTICE MODAL MUST BE LAST (ON TOP OF ALL) */}
      {notice && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '18px', overflow: 'hidden' }}>
              <div className="modal-body p-5 text-center">
                <div className="mb-3">{noticeIcon(notice.type)}</div>
                <h4 className="fw-bold mb-2" style={{ color: '#222' }}>{notice.title}</h4>
                <p className="text-muted mb-4" style={{ fontSize: '15px', lineHeight: '1.7' }}>{notice.message}</p>
                <div className="d-grid gap-2">
                  <button
                    className={`btn rounded-pill py-2 fw-bold ${notice.type === 'error' ? 'btn-danger' : notice.type === 'warning' ? 'btn-warning' : notice.type === 'success' ? 'btn-success' : 'btn-primary'}`}
                    onClick={() => {
                      if (notice.onPrimary) notice.onPrimary();
                      else closeNotice();
                    }}
                  >
                    {notice.primaryText || 'OK'}
                  </button>
                  {(notice.secondaryText) && (
                    <button
                      className="btn btn-light rounded-pill py-2"
                      onClick={() => {
                        if (notice.onSecondary) notice.onSecondary();
                        else closeNotice();
                      }}
                    >
                      {notice.secondaryText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
