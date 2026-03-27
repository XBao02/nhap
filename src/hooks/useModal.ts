// src/hooks/useModal.ts
import { useState, useEffect, useRef } from 'react';
import ModalManager, { ModalState } from '../services/ModalManager';

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>(
    ModalManager.getInstance().getState()
  );
  const modalManagerRef = useRef(ModalManager.getInstance());

  useEffect(() => {
    const modalManager = modalManagerRef.current;
    
    const unsubscribe = modalManager.subscribe((newState: ModalState) => {
      console.log('🔄 useModal: State changed:', {
        visible: newState.visible,
        hasComponent: !!newState.component,
        componentName: newState.component?.name || 'none'
      });
      setModalState(newState);
    });

    return unsubscribe;
  }, []);

  return modalState;
};