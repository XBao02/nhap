# Hướng dẫn sử dụng Public Modal System

## Tổng quan về hệ thống Modal

Hệ thống Modal được thiết kế như một singleton service cho phép hiển thị modal từ bất kỳ component nào trong ứng dụng mà không cần truyền props qua nhiều cấp component.

### Kiến trúc hệ thống:
1. **App.tsx**: Quản lý Modal state toàn cục và render Modal
2. **NavigationService.ts**: Cung cấp API để show/hide modal
3. **Components**: Sử dụng NavigationService để điều khiển modal

---

## Cách thức hoạt động

### 1. Trong App.tsx
```typescript
// State quản lý modal
const [modalVisible, setModalVisible] = useState(false);
const [modalComponent, setModalComponent] = useState<React.ComponentType<any> | null>(null);
const [modalProps, setModalProps] = useState<any>({});

// Setup modal handlers
useEffect(() => {
  NavigationService.setModalHandler((component, props = {}) => {
    setModalComponent(() => component);
    setModalProps({
      ...props,
      onClose: () => {
        closeModal();
        if (props.onClose) props.onClose();
      }
    });
    setModalVisible(true);
  });
  
  NavigationService.setModalCloseHandler(closeModal);
}, []);
```

### 2. Trong NavigationService.ts
```typescript
// API để show modal
showModal(component: React.ComponentType<any>, props?: any) {
  if (this.modalHandler) {
    this.modalHandler(component, props);
  }
}

// API để hide modal
hideModal() {
  if (this.modalCloseHandler) {
    this.modalCloseHandler();
  }
}
```

---

## Hướng dẫn tạo Modal mới

### Bước 1: Tạo Modal Component

Tạo file `src/components/modals/ImportGoogleSheet.tsx`:

```typescript
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import {useTheme} from '../../styles/ThemeContext';
import {useLanguage} from '../../i18n';

interface ImportGoogleSheetProps {
  onClose: () => void;
  onImportSuccess?: (data: any) => void;
  categoryId?: string;
}

export const ImportGoogleSheet: React.FC<ImportGoogleSheetProps> = ({
  onClose,
  onImportSuccess,
  categoryId,
}) => {
  const {theme} = useTheme();
  const {t} = useLanguage();
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!sheetUrl.trim()) {
      Alert.alert(t('error'), t('pleaseEnterSheetUrl'));
      return;
    }

    setIsLoading(true);
    try {
      // Logic import Google Sheet
      const response = await importFromGoogleSheet(sheetUrl, categoryId);
      
      if (onImportSuccess) {
        onImportSuccess(response.data);
      }
      
      Alert.alert(t('success'), t('importSuccessful'));
      onClose();
    } catch (error) {
      Alert.alert(t('error'), t('importFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.text}]}>
            {t('importFromGoogleSheet')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, {color: theme.primary}]}>
              {t('close')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.label, {color: theme.text}]}>
            {t('googleSheetUrl')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.inputBackground,
              },
            ]}
            value={sheetUrl}
            onChangeText={setSheetUrl}
            placeholder={t('enterGoogleSheetUrl')}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}>
              <Text style={[styles.buttonText, {color: theme.textSecondary}]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleImport}
              disabled={isLoading}
              style={[
                styles.button,
                styles.importButton,
                {backgroundColor: theme.primary},
                isLoading && {opacity: 0.6},
              ]}>
              <Text style={[styles.buttonText, {color: theme.white}]}>
                {isLoading ? t('importing') : t('import')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Mock function - thay thế bằng API thực tế
const importFromGoogleSheet = async (url: string, categoryId?: string) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          imported: 10,
          categoryId,
        },
      });
    }, 2000);
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modal: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  importButton: {
    // backgroundColor được set từ theme.primary
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ImportGoogleSheet;
```

### Bước 2: Sử dụng Modal trong Component

Trong file `src/components/CategoriesContent.tsx`:

```typescript
import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import {NavigationService} from '../registries/NavigationService';
import ImportGoogleSheet from './modals/ImportGoogleSheet';

interface CategoriesContentProps {
  // ... other props
}

export const CategoriesContent: React.FC<CategoriesContentProps> = ({
  // ... other props
}) => {
  // Handle show import modal
  const handleShowImportModal = () => {
    NavigationService.showModal(ImportGoogleSheet, {
      categoryId: 'current-category-id',
      onImportSuccess: (data) => {
        console.log('Import thành công:', data);
        // Refresh categories list hoặc update UI
        refreshCategoriesList();
      },
    });
  };

  const refreshCategoriesList = () => {
    // Logic refresh danh sách categories
    console.log('Refreshing categories list...');
  };

  return (
    <View style={styles.container}>
      {/* ... other content */}
      
      {/* Import Button */}
      <TouchableOpacity 
        onPress={handleShowImportModal}
        style={styles.importButton}>
        <Text style={styles.importButtonText}>
          Import từ Google Sheet
        </Text>
      </TouchableOpacity>
      
      {/* ... other content */}
    </View>
  );
};
```

---

## API Reference

### NavigationService Methods

#### `showModal(component, props?)`
Hiển thị modal với component và props được chỉ định.

**Parameters:**
- `component` (React.ComponentType): Component sẽ được render trong modal
- `props` (object, optional): Props sẽ được truyền cho component

**Example:**
```typescript
NavigationService.showModal(ImportGoogleSheet, {
  categoryId: '123',
  onImportSuccess: (data) => console.log(data),
});
```

#### `hideModal()`
Đóng modal hiện tại.

**Example:**
```typescript
NavigationService.hideModal();
```

---

## Best Practices

### 1. Modal Component Guidelines
- **Luôn nhận prop `onClose`**: Để user có thể đóng modal
- **Sử dụng SafeAreaView**: Đảm bảo content không bị che bởi status bar
- **Handle loading states**: Hiển thị trạng thái loading khi cần thiết
- **Responsive design**: Đảm bảo modal hoạt động tốt trên các màn hình khác nhau

### 2. Props Interface
```typescript
interface ModalProps {
  onClose: () => void;                    // Required: callback để đóng modal
  onSuccess?: (data: any) => void;        // Optional: callback khi thành công
  [key: string]: any;                     // Các props khác tùy theo needs
}
```

### 3. Error Handling
```typescript
const handleAction = async () => {
  try {
    setIsLoading(true);
    await someAsyncAction();
    onClose(); // Đóng modal sau khi thành công
  } catch (error) {
    // Handle error và không đóng modal
    Alert.alert('Error', error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Cleanup
Modal sẽ tự động cleanup sau khi đóng (300ms timeout trong App.tsx), nhưng nếu modal có subscriptions hoặc timers, hãy cleanup trong useEffect:

```typescript
useEffect(() => {
  return () => {
    // Cleanup code here
  };
}, []);
```

---

## Ví dụ hoàn chình từ LoginScreen.tsx

Trong code hiện tại, mặc dù LoginScreen.tsx không sử dụng modal, nhưng bạn có thể thêm như sau:

```typescript
// Trong LoginScreen.tsx
import {NavigationService} from '../../registries/NavigationService';
import SomeModal from '../modals/SomeModal';

// Trong component
const handleShowModal = () => {
  NavigationService.showModal(SomeModal, {
    userName: userName,
    onModalAction: (result) => {
      console.log('Modal result:', result);
    },
  });
};
```

---

## Lưu ý quan trọng

1. **Modal sẽ tự động thêm `onClose` handler** vào props, bạn không cần tự thêm
2. **Modal được render ở app level**, có thể hiển thị trên mọi screen
3. **Chỉ có thể hiển thị 1 modal tại 1 thời điểm**
4. **Modal tự động cleanup** sau khi đóng
5. **Sử dụng theme và i18n** trong modal component để đảm bảo consistency