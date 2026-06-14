import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const AntiCheatContext = createContext({ isDisqualified: false });

export const useAntiCheat = () => useContext(AntiCheatContext);

const EXEMPT_PATHS = ['/', '/login', '/register', '/onboarding'];

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#18181b',
  color: '#fff',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

// ─── Module-level state (survives React re-renders) ───
let _reportFn = null;         // set when anti-cheat is active
let _lastViolationTime = 0;

function dispatchViolation(type) {
  if (window.isLoggingOut) return;
  
  if (!_reportFn) return;

  const now = Date.now();
  if (now - _lastViolationTime < 1000) return; // Prevent double-trigger spam within 1 second
  _lastViolationTime = now;

  _reportFn(type);
}

// ─── Module-level event handlers (attached once, persist) ───
function onKeyDown(e) {
  if (!_reportFn) return;

  const key = e.key ? e.key.toLowerCase() : '';

  // Escape always triggers violation immediately
  if (key === 'escape') {
    dispatchViolation('FULLSCREEN_EXIT');
  }

  // F12
  if (e.key === 'F12') {
    e.preventDefault(); e.stopImmediatePropagation();
    dispatchViolation('DEVTOOLS_DETECTED');
    return false;
  }
  // F5
  if (e.key === 'F5') {
    e.preventDefault(); e.stopImmediatePropagation();
    dispatchViolation('KEYBOARD_SHORTCUT');
    return false;
  }

  // Ctrl+Shift combos
  if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
    if (['i','j','c','r'].includes(key)) {
      e.preventDefault(); e.stopImmediatePropagation();
      dispatchViolation('DEVTOOLS_DETECTED');
      return false;
    }
    if (key === 'tab') {
      e.preventDefault(); e.stopImmediatePropagation();
      dispatchViolation('KEYBOARD_SHORTCUT');
      return false;
    }
  }

  // Ctrl combos
  if (e.ctrlKey || e.metaKey) {
    if (['c','v','x'].includes(key)) {
      e.preventDefault(); e.stopImmediatePropagation();
      Toast.fire({ icon: 'info', title: 'System clipboard disabled. Use the floating copy/paste menu.' });
      return false;
    }
    if (['a','f','p','s','u','r','t','w'].includes(key)) {
      e.preventDefault(); e.stopImmediatePropagation();
      dispatchViolation('KEYBOARD_SHORTCUT');
      return false;
    }
    if (key === 'tab') {
      e.preventDefault(); e.stopImmediatePropagation();
      dispatchViolation('KEYBOARD_SHORTCUT');
      return false;
    }
  }
}

function onContextMenu(e) {
  e.preventDefault(); e.stopImmediatePropagation();
  return false;
}

function onCopy(e) {
  if (!_reportFn) return;
  e.preventDefault(); e.stopImmediatePropagation();
  Toast.fire({ icon: 'info', title: 'System clipboard disabled. Use the floating copy/paste menu.' });
}

function onVisibility() {
  if (!_reportFn) return;
  if (document.hidden) dispatchViolation('TAB_SWITCH');
}

function onBlur(e) {
  if (!_reportFn) return;
  // Only trigger if the WINDOW itself lost focus, not just an element (like a clicked link unmounting)
  if (e.target !== window && e.target !== document) return;
  dispatchViolation('WINDOW_BLUR');
}

// Attach ALL listeners once at module load (before React renders)
// capture=true ensures we intercept before any other handler
window.addEventListener('keydown', onKeyDown, true);
document.addEventListener('keydown', onKeyDown, true);
window.addEventListener('contextmenu', onContextMenu, true);
document.addEventListener('contextmenu', onContextMenu, true);
document.addEventListener('copy', onCopy, true);
document.addEventListener('cut', onCopy, true);
document.addEventListener('paste', onCopy, true);
document.addEventListener('visibilitychange', onVisibility, true);
window.addEventListener('blur', onBlur, true);

// Property-level fallbacks
document.oncontextmenu = () => false;
document.onkeydown = onKeyDown;

export const AntiCheatProvider = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const navigate = useNavigate();
  const location = useLocation();
  const [isDisqualified, setIsDisqualified] = useState(false);
  const userRef = useRef(user);
  const disqualifiedRef = useRef(false);

  const currentPath = location.pathname;
  const isAdmin = user && (user.role === 'admin' || (user.username === 'Error404 Admin' && user.email === 'error404@admin.com'));
  const isExempt = EXEMPT_PATHS.includes(currentPath) || isAdmin;

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { disqualifiedRef.current = isDisqualified; }, [isDisqualified]);

  useEffect(() => {
    if (user && user.warnings >= 3) {
      setIsDisqualified(true);
    } else {
      setIsDisqualified(false);
    }
  }, [user]);

  // The actual violation API caller
  const reportViolation = useCallback(async (type) => {
    if (!userRef.current || disqualifiedRef.current) return;
    console.log('[AntiCheat] Violation:', type);
    try {
      const res = await api.post('/violations', {
        violationType: type,
        metadata: { path: window.location.pathname, userAgent: navigator.userAgent }
      });
      const { warnings, disqualified } = res.data;

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            warnings: warnings || 0
          }
        });
      }

      if (fetchProfile) await fetchProfile();
      if (disqualified) {
        setIsDisqualified(true);
        disqualifiedRef.current = true;
        navigate('/dashboard');
      } else {
        Toast.fire({
          icon: 'warning',
          title: `WARNING ${warnings}/3 - ${type.replace(/_/g, ' ')} DETECTED`
        });
      }
    } catch (err) {
      console.error('[AntiCheat] API error:', err);
    }
  }, [fetchProfile, navigate]);

  const reportRef = useRef(reportViolation);
  useEffect(() => { reportRef.current = reportViolation; }, [reportViolation]);

  // Activate / deactivate the module-level reporter based on route + auth
  useEffect(() => {
    if (user && !isDisqualified && !isExempt) {
      // Active: wire up the report function
      _reportFn = (type) => reportRef.current(type);
      console.log('[AntiCheat] ACTIVE on:', currentPath);
    } else {
      // Inactive: disable reporting (but listeners stay attached, they just no-op)
      _reportFn = null;
      console.log('[AntiCheat] INACTIVE — exempt:', isExempt, 'user:', !!user);
    }
    return () => { _reportFn = null; };
  }, [user, isDisqualified, isExempt, currentPath]);

  // ─── Fullscreen monitoring (no auto-force, just warn) ───
  const wasInFullscreenRef = useRef(false);

  useEffect(() => {
    if (!user || isDisqualified || isExempt) return;

    const isFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);

    // Track initial fullscreen state
    if (isFS()) {
      wasInFullscreenRef.current = true;
    }

    // Realtime check function
    const checkFS = () => {
      if (window.isLoggingOut) return;
      const currentFS = isFS();
      
      if (!currentFS && wasInFullscreenRef.current) {
        // Only report violation if user was previously in fullscreen
        dispatchViolation('FULLSCREEN_EXIT');
        wasInFullscreenRef.current = false;
      } else if (currentFS && !wasInFullscreenRef.current) {
        // Mark that we are now in fullscreen
        wasInFullscreenRef.current = true;
      }
    };

    // Fast polling for absolute realtime detection (fixes event delays)
    const interval = setInterval(checkFS, 200);

    // Keep events as backup
    document.addEventListener('fullscreenchange', checkFS, true);
    document.addEventListener('webkitfullscreenchange', checkFS, true);

    return () => {
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', checkFS, true);
      document.removeEventListener('webkitfullscreenchange', checkFS, true);
    };
  }, [user, isDisqualified, isExempt, currentPath]);

  return (
    <AntiCheatContext.Provider value={{ isDisqualified }}>
      {children}
    </AntiCheatContext.Provider>
  );
};
