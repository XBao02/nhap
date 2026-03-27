// src/services/ModalManager.ts
import { EventEmitter } from 'events';
import { generateUID } from '../utils/generateUID';

export interface ModalState {
  visible: boolean;
  component: React.ComponentType<any> | null;
  props: any;
}

class ModalManager extends EventEmitter {
  private static instance: ModalManager;
  private modalState: ModalState = {
    visible: false,
    component: null,
    props: {},
  };

  private constructor() {
    super();
    this.setMaxListeners(10); // Tránh memory leak warnings
  }

  public static getInstance(): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager();
    }
    return ModalManager.instance;
  }

  public getState(): ModalState {
    return { ...this.modalState };
  }

  public showModal(component: React.ComponentType<any>, props: any = {}): void {
    console.log('🎭 ModalManager: Showing modal:', component.name || 'Unknown Component');
    console.log('🎯 ModalManager: Modal props:', props);

    this.modalState = {
      visible: true,
      component,
      props: {
        ...props,
        key: props.key || generateUID(), // Ensure unique key
        onClose: () => {
          this.closeModal();
          if (props.onClose) props.onClose();
        },
      },
    };

    this.emit('stateChanged', this.modalState);
  }

  public closeModal(): void {
    console.log('🚪 ModalManager: Modal closing');
    
    this.modalState = {
      ...this.modalState,
      visible: false,
    };
    
    this.emit('stateChanged', this.modalState);

    // Cleanup sau animation
    setTimeout(() => {
      this.modalState = {
        visible: false,
        component: null,
        props: {},
      };
      this.emit('stateChanged', this.modalState);
      console.log('🧹 ModalManager: Modal cleanup completed');
    }, 300);
  }

  public subscribe(callback: (state: ModalState) => void): () => void {
    this.on('stateChanged', callback);
    
    // Return unsubscribe function
    return () => {
      this.off('stateChanged', callback);
    };
  }
}

export default ModalManager;