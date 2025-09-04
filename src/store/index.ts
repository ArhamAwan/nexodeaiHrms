import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export type AuthState = {
	accessToken: string | null;
	user: { id: string; email: string; role: string } | null;
};

const initialState: AuthState = { accessToken: null, user: null };

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setCredentials(state, action: PayloadAction<AuthState>) {
			state.accessToken = action.payload.accessToken;
			state.user = action.payload.user;
		},
		clearCredentials(state) {
			state.accessToken = null;
			state.user = null;
		},
	},
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export const store = configureStore({
	reducer: {
		auth: authSlice.reducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
