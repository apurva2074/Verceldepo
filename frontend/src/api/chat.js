// src/api/chat.js - Unified Firestore-based Chat API
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { auth } from '../firebase/auth';

export const chatAPI = {
  /**
   * Create or get existing chat between tenant and owner
   * @param {string} propertyId - Property ID
   * @param {string} ownerId - Property owner ID
   * @returns {Promise<Object>} Chat data
   */
  createOrGetChat: async (propertyId, ownerId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }

      const tenantId = currentUser.uid;
      
      console.log('🔍 Looking for existing chat:', { propertyId, ownerId, tenantId });

      // Check if chat already exists
      const chatsQuery = query(
        collection(db, 'chats'),
        where('propertyId', '==', propertyId),
        where('tenantId', '==', tenantId),
        where('ownerId', '==', ownerId)
      );

      const existingChats = await getDocs(chatsQuery);
      
      if (!existingChats.empty) {
        const chatDoc = existingChats.docs[0];
        const chatData = { chatId: chatDoc.id, ...chatDoc.data() };
        console.log('✅ Found existing chat:', chatData.chatId);
        return chatData;
      }

      // Create new chat
      console.log('➕ Creating new chat');
      const chatData = {
        propertyId,
        ownerId,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: {
          [ownerId]: 0,
          [tenantId]: 0
        },
        typingIndicators: {},
        participants: [ownerId, tenantId],
        status: 'active'
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      const newChat = { chatId: chatRef.id, ...chatData };
      
      console.log('✅ New chat created:', newChat.chatId);
      return newChat;
    } catch (error) {
      console.error('❌ Failed to create/get chat:', error);
      throw new Error('Failed to create chat');
    }
  },

  /**
   * Get all chats for current user
   * @returns {Promise<Array>} User's chats
   */
  getUserChats: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }

      const userId = currentUser.uid;
      
      console.log('🔍 Fetching chats for user:', userId);

      // Get chats where user is either owner or tenant
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const chatSnapshot = await getDocs(chatsQuery);
      const chats = chatSnapshot.docs.map(doc => ({
        chatId: doc.id,
        ...doc.data()
      }));

      console.log(`✅ Found ${chats.length} chats for user`);
      return { chats };
    } catch (error) {
      console.error('❌ Failed to get user chats:', error);
      throw new Error('Failed to load chats');
    }
  },

  /**
   * Get specific chat by ID
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Chat data
   */
  getChatById: async (chatId) => {
    try {
      console.log('🔍 Fetching chat:', chatId);
      
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = { chatId: chatDoc.id, ...chatDoc.data() };
      console.log('✅ Chat fetched successfully');
      return chatData;
    } catch (error) {
      console.error('❌ Failed to get chat by ID:', error);
      throw new Error('Chat not found');
    }
  },

  /**
   * Send message in chat
   * @param {string} chatId - Chat ID
   * @param {string} message - Message content
   * @param {string} messageType - Message type (text, image, etc.)
   * @returns {Promise<Object>} Sent message data
   */
  sendMessage: async (chatId, message, messageType = 'text') => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }

      console.log('📤 Sending message to chat:', chatId);

      const messageData = {
        chatId,
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        message: message.trim(),
        messageType,
        timestamp: serverTimestamp(),
        read: false,
        reactions: {},
        replyTo: null,
        edited: false,
        editedAt: null
      };

      // Add message to messages subcollection
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messageRef = await addDoc(messagesRef, messageData);

      const sentMessage = { messageId: messageRef.id, ...messageData };
      console.log('✅ Message sent successfully:', messageRef.id);

      // Update chat with last message info
      await this.updateChatLastMessage(chatId, sentMessage);

      return sentMessage;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw new Error('Failed to send message');
    }
  },

  /**
   * Update chat with last message info
   * @param {string} chatId - Chat ID
   * @param {Object} messageData - Message data
   */
  updateChatLastMessage: async (chatId, messageData) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      
      // Increment unread count for recipient
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        console.error('No authenticated user for updating chat last message');
        return;
      }
      
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      
      const recipientId = chatData.ownerId === currentUser.uid ? 
        chatData.tenantId : chatData.ownerId;

      await updateDoc(chatRef, {
        lastMessage: messageData.message,
        lastMessageTime: messageData.timestamp,
        lastSenderId: messageData.senderId,
        updatedAt: serverTimestamp(),
        [`unreadCount.${recipientId}`]: increment(1)
      });

      console.log('✅ Chat last message updated');
    } catch (error) {
      console.error('❌ Failed to update chat last message:', error);
    }
  },

  /**
   * Get messages for a chat
   * @param {string} chatId - Chat ID
   * @param {number} limit - Message limit (optional)
   * @returns {Promise<Array>} Messages
   */
  getMessages: async (chatId, limit = 50) => {
    try {
      console.log('🔍 Fetching messages for chat:', chatId);

      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const messageSnapshot = await getDocs(messagesQuery);
      const messages = messageSnapshot.docs.map(doc => ({
        messageId: doc.id,
        ...doc.data()
      })).reverse(); // Show oldest first

      console.log(`✅ Found ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ Failed to get messages:', error);
      throw new Error('Failed to load messages');
    }
  },

  /**
   * Set up real-time listener for chat updates
   * @param {string} chatId - Chat ID
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onChatUpdate: (chatId, callback) => {
    console.log('👂 Setting up chat listener:', chatId);

    const unsubscribe = onSnapshot(doc(db, 'chats', chatId), (doc) => {
      if (doc.exists()) {
        const chatData = { chatId: doc.id, ...doc.data() };
        callback(chatData);
      } else {
        console.warn('Chat not found:', chatId);
        callback(null);
      }
    }, (error) => {
      console.error('❌ Chat listener error:', error);
    });

    return unsubscribe;
  },

  /**
   * Set up real-time listener for messages
   * @param {string} chatId - Chat ID
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onMessagesUpdate: (chatId, callback) => {
    console.log('👂 Setting up messages listener:', chatId);

    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        messageId: doc.id,
        ...doc.data()
      })).reverse(); // Show oldest first

      callback(messages);
    }, (error) => {
      console.error('❌ Messages listener error:', error);
    });

    return unsubscribe;
  },

  /**
   * Set typing indicator
   * @param {string} chatId - Chat ID
   * @param {boolean} isTyping - Whether user is typing
   */
  setTypingIndicator: async (chatId, isTyping) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        return;
      }

      console.log('⌨️ Setting typing indicator:', { chatId, isTyping });

      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`typingIndicators.${currentUser.uid}`]: {
          isTyping,
          timestamp: serverTimestamp(),
          userName: currentUser.displayName || currentUser.email
        }
      });

      // Auto-clear typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(async () => {
          await updateDoc(chatRef, {
            [`typingIndicators.${currentUser.uid}.isTyping`]: false
          });
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Failed to set typing indicator:', error);
    }
  },

  /**
   * Mark messages as read
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID (optional, marks all as read if not provided)
   */
  markAsRead: async (chatId, messageId = null) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        return;
      }

      console.log('👁️ Marking messages as read:', { chatId, messageId });

      if (messageId) {
        // Mark specific message as read
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        await updateDoc(messageRef, { read: true });
      } else {
        // Mark all messages as read and reset unread count
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
          [`unreadCount.${currentUser.uid}`]: 0
        });

        // Mark all messages as read
        const messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          where('senderId', '!=', currentUser.uid),
          where('read', '==', false)
        );

        const unreadMessages = await getDocs(messagesQuery);
        const batch = [];
        unreadMessages.forEach(doc => {
          batch.push(updateDoc(doc.ref, { read: true }));
        });

        await Promise.all(batch);
      }

      console.log('✅ Messages marked as read');
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
    }
  },

  /**
   * Add reaction to message
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID
   * @param {string} emoji - Reaction emoji
   */
  addReaction: async (chatId, messageId, emoji) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }

      console.log('😊 Adding reaction:', { chatId, messageId, emoji });

      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        [`reactions.${currentUser.uid}`]: {
          emoji,
          timestamp: serverTimestamp(),
          userName: currentUser.displayName || currentUser.email
        }
      });

      console.log('✅ Reaction added successfully');
    } catch (error) {
      console.error('❌ Failed to add reaction:', error);
      throw new Error('Failed to add reaction');
    }
  },

  /**
   * Remove reaction from message
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID
   */
  removeReaction: async (chatId, messageId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }

      console.log('🚫 Removing reaction:', { chatId, messageId });

      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        [`reactions.${currentUser.uid}`]: null
      });

      console.log('✅ Reaction removed successfully');
    } catch (error) {
      console.error('❌ Failed to remove reaction:', error);
      throw new Error('Failed to remove reaction');
    }
  },

  /**
   * Delete message
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID
   */
  deleteMessage: async (chatId, messageId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated');
      }

      console.log('🗑️ Deleting message:', { chatId, messageId });

      // Check if user is the sender
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();
      if (messageData.senderId !== currentUser.uid) {
        throw new Error('You can only delete your own messages');
      }

      await deleteDoc(messageRef);
      console.log('✅ Message deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      throw new Error('Failed to delete message');
    }
  },
};

export default chatAPI;
