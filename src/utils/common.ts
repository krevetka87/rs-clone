import { LSKeys, KEY_LOCAL_STORAGE } from '../constants';
import { ISetLastMessages } from '../types/common';
import { TLastMessage } from '../types/data';

const accessTokenItemKey = `${LSKeys.token}_${KEY_LOCAL_STORAGE}`;

const getFirstLetter = (str: string): string => str.slice(0, 1);
const setToken = (value: string): void => localStorage.setItem(accessTokenItemKey, value);
const removeToken = (): void => localStorage.removeItem(accessTokenItemKey);
const getToken = (): string | null => localStorage.getItem(accessTokenItemKey);
const getActionString = (type: string, payload: unknown): string => JSON.stringify({ type, payload });
const setLastMessages = ({
  chats,
  numberOfUnreadMessagesInChats,
  lastMessagesInChats,
  idAuthorizedUser,
}: ISetLastMessages): void => {
  const lastMessages = chats.reduce<TLastMessage[]>((acc, chat) => {
    if (numberOfUnreadMessagesInChats && lastMessagesInChats) {
      const numberOfUnreadMessage = numberOfUnreadMessagesInChats.find((val) => val.chatId === chat.id);
      if (numberOfUnreadMessage) {
        const dataLastMessage = lastMessagesInChats.find(
          (lastMessage) => lastMessage.chatId === numberOfUnreadMessage.chatId
        );
        if (dataLastMessage) {
          acc.push(dataLastMessage);
          return acc;
        }
      }
    }
    if (chat.messages.length > 0) {
      acc.push({
        chatId: chat.id,
        userId: +chat.userIds.filter((userId) => userId !== idAuthorizedUser).join(),
        idLastMessage: chat.messages[chat.messages.length - 1].id,
      });
    }

    return acc;
  }, []);

  localStorage.setItem(`${LSKeys.lastMessages}_${idAuthorizedUser}_${KEY_LOCAL_STORAGE}`, JSON.stringify(lastMessages));
};

export { getFirstLetter, setToken, removeToken, getToken, getActionString, setLastMessages };
