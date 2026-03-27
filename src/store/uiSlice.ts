import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isSidebarOpen: boolean;
  currentScreen: string;
}

const initialState: UiState = {
  isSidebarOpen: false,
  currentScreen: 'Dashboard',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    setCurrentScreen: (state, action: PayloadAction<string>) => {
      state.currentScreen = action.payload;
    },
  },
});

export const { setSidebarOpen, setCurrentScreen } = uiSlice.actions;
export default uiSlice.reducer;