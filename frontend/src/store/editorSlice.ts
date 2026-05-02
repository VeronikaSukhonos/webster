import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './store';

interface EditorState {
  sth: string;
}

const initialState: EditorState = {
  sth: '',
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    doSth: (state, action: PayloadAction<{ sth: string }>) => {
      state.sth = action.payload?.sth;
    },
  },
});

export const { doSth } = editorSlice.actions;

export const selectEditor = {
  sth: (state: RootState) => state.editor.sth,
};

export default editorSlice.reducer;
