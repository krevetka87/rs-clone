import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReducerNames } from '../../constants';
import { TUsersState } from '../../types/state';
import { IUser } from '../../types/data';

const initialState: TUsersState = {
  users: [],
  currentProfile: null,
  idCurrentProfile: 0,
  authorizedUser: null,
  idAuthorizedUser: 0,
  defineUserCompleted: false,
  authorizedUserFriends: [],
  authorizedUserPendingFriends: [],
  messagesWs: null,
  avatarUrl: '',
};

const usersStateSlice = createSlice({
  name: ReducerNames.users,
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      state.authorizedUser = action.payload;
      state.idAuthorizedUser = action.payload.id;
    },
    usersLoadingSuccess: (state, action: PayloadAction<IUser[]>) => {
      if (state.idAuthorizedUser) {
        state.users = action.payload.map((user) => {
          if (user.id === state.idAuthorizedUser && state.authorizedUser) {
            return { ...user, isOnline: state.authorizedUser.isOnline, lastSeen: state.authorizedUser.lastSeen };
          }
          return user;
        });
      } else {
        state.users = action.payload;
      }
    },
    defineProfile: (state, action: PayloadAction<string>) => {
      if (action.payload.slice(0, 2) === 'id') {
        const possibleId = Number(action.payload.slice(2));
        const foundUser = state.users.find((user) => user.id === possibleId);
        if (foundUser) {
          state.currentProfile = foundUser;
          state.idCurrentProfile = possibleId;
        }
      } else {
        const foundUser = state.users.find((user) => user.alias === action.payload);
        if (foundUser) {
          state.currentProfile = foundUser;
          state.idCurrentProfile = foundUser.id;
        } else {
          state.currentProfile = null;
          state.idCurrentProfile = 0;
        }
      }
      state.defineUserCompleted = true;
    },
    updateUserInState: (state, action: PayloadAction<IUser>) => {
      state.users = state.users.map((user) => (user.id === action.payload.id ? action.payload : user));
      if (action.payload.id === state.idAuthorizedUser) {
        state.authorizedUser = action.payload;
      }
      if (action.payload.id === state.idCurrentProfile) {
        state.currentProfile = action.payload;
      }
    },
    definePendingFriends: (state, action: PayloadAction<number[]>) => {
      state.authorizedUserPendingFriends = state.users.filter((user) => action.payload.includes(user.id));
    },
    defineFriends: (state, action: PayloadAction<number[]>) => {
      state.authorizedUserFriends = state.users.filter((user) => action.payload.includes(user.id));
    },
    setMessagesWs: (state, action: PayloadAction<WebSocket>) => {
      state.messagesWs = action.payload;
    },
    setAvatar: (state, action: PayloadAction<string>) => {
      state.avatarUrl = action.payload;
    },
    updateUserStatusInState: (state, action: PayloadAction<{ id: number; isOnline: boolean }>) => {
      state.users = state.users.map((user) =>
        user.id === action.payload.id ? { ...user, isOnline: action.payload.isOnline } : user
      );
      if (action.payload.id === state.idAuthorizedUser && state.authorizedUser) {
        state.authorizedUser = { ...state.authorizedUser, isOnline: action.payload.isOnline };
      }
      if (action.payload.id === state.idCurrentProfile && state.currentProfile) {
        state.currentProfile = { ...state.currentProfile, isOnline: action.payload.isOnline };
      }
    },
  },
});

export const {
  usersLoadingSuccess,
  defineProfile,
  updateUserInState,
  setUser,
  definePendingFriends,
  defineFriends,
  setMessagesWs,
  setAvatar,
  updateUserStatusInState,
} = usersStateSlice.actions;

export const usersState = usersStateSlice.reducer;
