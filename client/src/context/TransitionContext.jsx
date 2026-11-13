import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TransitionContext = createContext({
  smoothNavigate: () => {},
});

export function TransitionProvider({ children }) {
  const navigate = useNavigate();
  const [veilState, setVeilState] = useState({
    visible: false,
    tone: '#F8F6F2',
  });
  const timerRef = useRef(null);

  const smoothNavigate = useCallback(
    (to, options = {}) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const targetPath = typeof to === 'string' ? to : to?.pathname || '/';
      const tone = targetPath === '/' ? '#18120E' : '#F8F6F2';

      setVeilState({ visible: true, tone });

      timerRef.current = setTimeout(() => {
        navigate(to, options);
        window.scrollTo({ top: 0, behavior: 'instant' });
        requestAnimationFrame(() => {
          setVeilState((prev) => ({ ...prev, visible: false }));
        });
      }, 280);
    },
    [navigate]
  );

  return (
    <TransitionContext.Provider value={{ smoothNavigate }}>
      {children}
      <div
        aria-hidden="true"
        style={{ backgroundColor: veilState.tone }}
        className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-300 ease-out ${
          veilState.visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </TransitionContext.Provider>
  );
}

export function useSmoothNavigate() {
  return useContext(TransitionContext).smoothNavigate;
}
