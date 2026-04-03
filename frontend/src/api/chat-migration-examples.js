// Example: How to migrate Chat component to use unified Firestore chat API
// src/pages/Chat/ChatExample.js

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatAPI } from '../../api'; // ✅ Use unified chat API

export default function ChatExample() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ✅ NEW: Unified real-time listeners setup
  const setupRealtimeListeners = useCallback(() => {
    if (!chatId) return;

    console.log('👂 Setting up unified Firestore listeners');

    // Chat updates listener
    const chatUnsubscribe = chatAPI.onChatUpdate(chatId, (chatData) => {
      if (chatData) {
        setChat(chatData);
        
        // Handle typing indicators
        const currentUser = chatAPI.getCurrentUser();
        const otherUserId = chatData.ownerId === currentUser.uid ? 
          chatData.tenantId : chatData.ownerId;
        
        const otherUserTyping = chatData.typingIndicators?.[otherUserId]?.isTyping || false;
        setIsTyping(otherUserTyping);
      }
    });

    // Messages listener
    const messagesUnsubscribe = chatAPI.onMessagesUpdate(chatId, (messageData) => {
      setMessages(messageData);
      scrollToBottom();
    });

    // Cleanup function
    return () => {
      chatUnsubscribe();
      messagesUnsubscribe();
    };
  }, [chatId]);

  // Initialize chat and set up listeners
  useEffect(() => {
    if (!chatId) return;

    const initializeChat = async () => {
      try {
        setLoading(true);
        
        // Get chat data
        const chatData = await chatAPI.getChatById(chatId);
        setChat(chatData);
        
        // Get initial messages
        const initialMessages = await chatAPI.getMessages(chatId);
        setMessages(initialMessages);
        
        // Set up real-time listeners
        const cleanup = setupRealtimeListeners();
        
        setLoading(false);
        
        return cleanup;
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setLoading(false);
        // Handle error (redirect, show message, etc.)
      }
    };

    const cleanup = initializeChat();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [chatId, setupRealtimeListeners]);

  // ✅ NEW: Send message using unified API
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      // Send message using unified API
      await chatAPI.sendMessage(chatId, newMessage.trim());
      
      // Clear input
      setNewMessage("");
      
      // Mark messages as read
      await chatAPI.markAsRead(chatId);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error (show toast, etc.)
    } finally {
      setSendingMessage(false);
    }
  };

  // ✅ NEW: Handle typing indicator
  const handleTyping = async (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator
    if (value.trim()) {
      await chatAPI.setTypingIndicator(chatId, true);
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(async () => {
        await chatAPI.setTypingIndicator(chatId, false);
      }, 3000);
    } else {
      await chatAPI.setTypingIndicator(chatId, false);
    }
  };

  // ✅ NEW: Add reaction to message
  const handleAddReaction = async (messageId, emoji) => {
    try {
      await chatAPI.addReaction(chatId, messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  // ✅ NEW: Mark messages as read
  const markAsRead = async () => {
    try {
      await chatAPI.markAsRead(chatId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Helper function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <div className="chat-loading">Loading chat...</div>;
  }

  if (!chat) {
    return <div className="chat-error">Chat not found</div>;
  }

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <h3>{chat.propertyTitle || 'Chat'}</h3>
        {isTyping && <span className="typing-indicator">Typing...</span>}
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.messageId} 
            className={`message ${message.senderId === chatAPI.getCurrentUser()?.uid ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <p>{message.message}</p>
              <span className="message-time">
                {message.timestamp?.toDate ? new Date(message.timestamp.toDate()).toLocaleTimeString() : new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            {/* Reactions */}
            {message.reactions && (
              <div className="message-reactions">
                {Object.entries(message.reactions).map(([userId, reaction]) => (
                  <span key={userId} className="reaction">
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}
            
            {/* Reaction buttons */}
            <div className="message-actions">
              <button onClick={() => handleAddReaction(message.messageId, '👍')}>
                👍
              </button>
              <button onClick={() => handleAddReaction(message.messageId, '❤️')}>
                ❤️
              </button>
              <button onClick={() => handleAddReaction(message.messageId, '😂')}>
                😂
              </button>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          disabled={sendingMessage}
        />
        <button type="submit" disabled={sendingMessage || !newMessage.trim()}>
          {sendingMessage ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

// ✅ NEW: Tenant Chat List Component Example
// src/pages/TenantDashboard/components/TenantChatExample.js

import React, { useState, useEffect } from "react";
import { chatAPI } from '../../../api';

export default function TenantChatExample() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        // ✅ NEW: Use unified chat API
        const response = await chatAPI.getUserChats();
        setChats(response.chats);
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  const handleChatClick = async (propertyId, ownerId) => {
    try {
      // ✅ NEW: Create or get chat using unified API
      const chat = await chatAPI.createOrGetChat(propertyId, ownerId);
      // Navigate to chat
      window.location.href = `/chat/${chat.chatId}`;
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  };

  if (loading) return <div>Loading chats...</div>;

  return (
    <div className="chat-list">
      <h2>My Chats</h2>
      {chats.length === 0 ? (
        <p>No chats yet</p>
      ) : (
        chats.map((chat) => (
          <div 
            key={chat.chatId} 
            className="chat-item"
            onClick={() => handleChatClick(chat.propertyId, chat.ownerId)}
          >
            <h3>{chat.propertyTitle || 'Property Chat'}</h3>
            <p>{chat.lastMessage || 'No messages yet'}</p>
            <span className="chat-time">
              {chat.lastMessageTime && 
                (chat.lastMessageTime.toDate ? new Date(chat.lastMessageTime.toDate()).toLocaleString() : new Date(chat.lastMessageTime).toLocaleString())
              }
            </span>
          </div>
        ))
      )}
    </div>
  );
}
