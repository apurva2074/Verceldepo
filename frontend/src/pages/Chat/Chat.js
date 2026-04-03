import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Chat.css";

import Header from "../../MyComponent/Header";
import { db } from "../../firebase/firestore";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { sendMessage, sendTypingIndicator, markMessagesAsRead, addMessageReaction, getChatById } from "../../services/chatService";
import { useAuth } from "../../hooks/useAuth";
import { getAuthToken } from "../../utils/authToken";

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const setupRealtimeListeners = useCallback((initialChatData) => {
    // Guard against null user
    if (!user || !user.uid) {
      console.error('Cannot setup listeners: No authenticated user');
      return () => {};
    }

    // Real-time chat listener
    console.log(`Setting up chat listener for chat: ${chatId}`);
    console.log(`Current user UID: ${user?.uid}`);
    
    const chatUnsub = onSnapshot(doc(db, "chats", chatId), async (chatDoc) => {
      console.log(`Chat snapshot received, exists: ${chatDoc.exists()}`);
      console.log(`Current user UID: ${user?.uid}`);
      
      if (chatDoc.exists()) {
        const chatData = { chatId: chatDoc.id, ...chatDoc.data() };
        console.log(`Chat data:`, chatData);
        console.log(`Participants array:`, chatData.participants);
        console.log(`Is current user in participants:`, chatData.participants?.includes(user?.uid));
        setChat(chatData);
        
        // Handle typing indicators
        const typingIndicators = chatData.typingIndicators || {};
        const otherUserId = chatData.ownerId === user.uid ? chatData.tenantId : chatData.ownerId;
        const otherUserTyping = typingIndicators[otherUserId];
        setIsTyping(otherUserTyping?.isTyping || false);
        
        // Determine if the other user is an owner or tenant
        try {
          const isOtherUserOwner = chatData.ownerId === otherUserId;
          
          if (isOtherUserOwner) {
            // Fetch owner's actual name from API
            try {
              console.log(`Fetching owner info for chat: ${otherUserId}`);
              const token = await getAuthToken();
              const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/users/${otherUserId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const ownerData = await response.json();
                console.log(`Owner data received for chat:`, ownerData);
                setOtherUser({
                  name: ownerData.name || 'Property Owner',
                  role: 'owner',
                  email: ownerData.email || null,
                  uid: otherUserId
                });
              } else {
                throw new Error('Failed to fetch owner data');
              }
            } catch (fetchError) {
              console.warn('Could not fetch owner name, using fallback:', fetchError);
              setOtherUser({
                name: 'Property Owner',
                role: 'owner',
                email: null,
                uid: otherUserId
              });
            }
          } else {
            // For tenants, show "Tenant" (we could fetch tenant name too if needed)
            setOtherUser({
              name: 'Tenant',
              role: 'tenant',
              email: null,
              uid: otherUserId
            });
          }
          
          console.log('Other user role:', isOtherUserOwner ? 'owner' : 'tenant');
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to generic names
          const isOtherUserOwner = chatData.ownerId === otherUserId;
          setOtherUser({
            name: isOtherUserOwner ? "Property Owner" : "Tenant",
            role: isOtherUserOwner ? "owner" : "tenant",
            uid: otherUserId
          });
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to chat:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide user-friendly error messages
      if (error.code === 'permission-denied') {
        console.error('Permission denied - User may not be a participant in this chat');
      } else if (error.code === 'unavailable') {
        console.error('Firebase connection unavailable');
      } else if (error.code === 'unauthenticated') {
        console.error('User not authenticated');
      }
      
      setLoading(false);
    });

    // Real-time messages listener
    const messagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    
    console.log(`Setting up messages listener for chat: ${chatId}`);
    console.log(`Current user UID: ${user?.uid}`);
    
    const messagesUnsub = onSnapshot(messagesQuery, (snapshot) => {
      console.log(`Messages snapshot received: ${snapshot.docs.length} messages`);
      const messagesData = snapshot.docs.map(doc => {
        const messageData = doc.data();
        return {
          messageId: doc.id,
          ...messageData,
          // Ensure required fields exist with defaults
          senderId: messageData.senderId || 'unknown',
          text: messageData.text || '',
          createdAt: messageData.createdAt || null
        };
      });
      setMessages(messagesData);
      
      // Mark messages as read when they are loaded
      const unreadMessages = messagesData.filter(
        msg => msg && msg.senderId !== user?.uid && !msg.read
      );
      if (unreadMessages.length > 0) {
        console.log(`Marking ${unreadMessages.length} messages as read for chat: ${chatId}`);
        markMessagesAsRead(chatId)
          .then(result => {
            console.log("Messages marked as read successfully:", result);
          })
          .catch(err => {
            console.error('Error marking messages as read:', err);
            console.error('Full error details:', err.message, err.stack);
          });
      }
    }, (error) => {
      console.error('Error listening to messages:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide user-friendly error messages
      if (error.code === 'permission-denied') {
        console.error('Permission denied - User may not be a participant in this chat');
      } else if (error.code === 'unavailable') {
        console.error('Firebase connection unavailable');
      } else if (error.code === 'unauthenticated') {
        console.error('User not authenticated');
      }
    });

    return () => {
      chatUnsub();
      messagesUnsub();
    };
  }, [chatId, user]);

  useEffect(() => {
    // Show loading while auth is loading or no user
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    // First, verify chat access via API
    const verifyChatAccess = async () => {
      try {
        const chatData = await getChatById(chatId);
        console.log('Chat access verified:', chatData);
        
        // Set initial chat data
        setChat(chatData);
        
        // Now set up real-time listeners
        setupRealtimeListeners(chatData);
        
      } catch (error) {
        console.error('Chat access denied:', error);
        setLoading(false);
        
        // Show appropriate error message
        if (error.message.includes('ACCESS_DENIED') || error.message.includes('403')) {
          alert('You do not have permission to access this chat.');
        } else if (error.message.includes('CHAT_NOT_FOUND') || error.message.includes('404')) {
          alert('Chat not found.');
        } else {
          alert('Unable to load chat. Please try again.');
        }
        
        // Navigate back to appropriate dashboard
        navigate('/dashboard');
      }
    };

    verifyChatAccess();
  }, [chatId, user, authLoading, navigate, setupRealtimeListeners]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sendingMessage) return;

    // Check if user can send messages
    if (chat?.isReadonly && chat?.userRole !== 'owner') {
      console.log('Cannot send message: Chat is read-only');
      return;
    }

    setSendingMessage(true);
    try {
      // Use API service for message sending to ensure proper authorization
      await sendMessage(chatId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to send message';
      if (errorMessage.includes('read-only')) {
        alert('Cannot send message: Chat is read-only');
      } else if (errorMessage.includes('ACCESS_DENIED')) {
        alert('You are not authorized to send messages in this chat');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    sendTypingIndicator(chatId, e.target.value.trim().length > 0).catch(err => 
      console.error('Error sending typing indicator:', err)
    );
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Hide typing indicator after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(chatId, false).catch(err => 
        console.error('Error stopping typing indicator:', err)
      );
    }, 1000);
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const addReaction = async (messageId, emoji) => {
    try {
      await addMessageReaction(chatId, messageId, emoji);
      // The reactions will be updated via the real-time listener
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const emojis = ['Heart', 'ThumbsUp', 'Happy', 'Laughing', 'Surprised', 'Sad', 'Clap', 'Fire'];

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(message =>
        message.message?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [searchQuery, messages]);

  const getMessageStatus = (message) => {
    if (!user?.uid || message.senderId !== user.uid) return null;
    
    if (message.read) {
      return { status: 'read', icon: '✓✓', color: '#0084ff' };
    } else {
      return { status: 'sent', icon: '✓', color: '#999' };
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="chat-full-loading">
          <div className="loading-overlay">
            <div className="loading-spinner-container">
              <div className="spinner"></div>
              <p>Loading chat...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!chat) {
    return (
      <div className="chat-error">
        <Header />
        <div className="error-container">
          <h3>Chat not found</h3>
          <p>The chat you're looking for doesn't exist or you don't have access to it.</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <button 
              className="back-btn"
              onClick={() => {
                // Determine current user's role from chat data
                const isCurrentUserOwner = chat && user?.uid && chat.ownerId === user.uid;
                
                if (isCurrentUserOwner) {
                  // Current user is owner - go to owner dashboard with chat tab active
                  navigate('/owner/dashboard', { state: { activeTab: 'chat' } });
                } else {
                  // Current user is tenant - go to tenant dashboard with messages tab active
                  navigate('/dashboard', { state: { activeTab: 'messages' } });
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="chat-user-info">
              <div className="user-avatar">
                <div className="avatar-circle">
                  {otherUser?.role === 'owner' ? 'Owner' : 'Tenant'}
                </div>
                <div className={`online-indicator ${isTyping ? 'typing' : 'offline'}`}></div>
              </div>
              <div className="user-details">
                <h3>{otherUser?.name || 'Property Owner'}</h3>
                <div className="user-status">
                  <span className="status-text">
                    {isTyping ? 'typing...' : 'Offline'}
                  </span>
                  <span className="property-info">
                    {chat?.property?.title || 'Property Discussion'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="chat-header-right">
            <button 
              className="chat-action-btn"
              onClick={() => setShowSearch(!showSearch)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button className="chat-action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </button>
            <button className="chat-action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="chat-search-bar">
            <div className="search-input-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button 
                className="clear-search"
                onClick={() => setSearchQuery('')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            {searchQuery && (
              <div className="search-results">
                Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Messages Container */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-icon">Chat</div>
              <h3>No messages yet</h3>
              <p>Start the conversation by sending a message below.</p>
            </div>
          ) : (
            <div className="messages-list">
              {(searchQuery ? filteredMessages : messages).map((message, index) => {
                const isOwn = user?.uid && message.senderId === user.uid;
                const showDate = index === 0 || 
                  new Date((searchQuery ? filteredMessages : messages)[index]?.timestamp?.toDate?.() || (searchQuery ? filteredMessages : messages)[index]?.timestamp || 0).toDateString() !== 
                  new Date((searchQuery ? filteredMessages : messages)[index - 1]?.timestamp?.toDate?.() || (searchQuery ? filteredMessages : messages)[index - 1]?.timestamp || 0).toDateString();
                
                const messageStatus = getMessageStatus(message);
                
                return (
                  <div key={message.messageId}>
                    {showDate && (
                      <div className="date-divider">
                        <span>{formatDate(message.timestamp)}</span>
                      </div>
                    )}
                    <div className={`message ${isOwn ? 'own' : 'other'}`}>
                      {!isOwn && (
                        <div className="message-avatar">
                          <div className="mini-avatar">
                            {otherUser?.role === 'owner' ? 'Owner' : 'Tenant'}
                          </div>
                        </div>
                      )}
                      <div className="message-content">
                        {!isOwn && (
                          <div className="sender-name">
                            {otherUser?.name || 'Property Owner'}
                          </div>
                        )}
                        <div className="message-bubble">
                          <p className="message-text">{message.message}</p>
                          <div className="message-meta">
                            <span className="message-time">{formatTime(message.timestamp)}</span>
                            {messageStatus && (
                              <span className="message-status" style={{ color: messageStatus.color }}>
                                {messageStatus.icon}
                              </span>
                            )}
                          </div>
                          {/* Reactions */}
                          {message.reactions && Object.keys(message.reactions).length > 0 && (
                            <div className="message-reactions">
                              {Object.entries(message.reactions).map(([userId, reaction]) => (
                                <span key={userId} className="reaction">
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="message-actions">
                          <button 
                            className="reaction-btn"
                            onClick={() => setShowEmojiPicker(showEmojiPicker === message.messageId ? null : message.messageId)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                              <line x1="9" y1="9" x2="9.01" y2="9"/>
                              <line x1="15" y1="9" x2="15.01" y2="9"/>
                            </svg>
                          </button>
                          {showEmojiPicker === message.messageId && (
                            <div className="emoji-picker">
                              {emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  className="emoji-option"
                                  onClick={() => addReaction(message.messageId, emoji)}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="message other">
                  <div className="message-avatar">
                    <div className="mini-avatar">
                      {otherUser?.role === 'owner' ? 'Owner' : 'Tenant'}
                    </div>
                  </div>
                  <div className="message-content">
                    <div className="message-bubble typing-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="message-input-container">
          {chat?.isReadonly ? (
            <div className="readonly-chat-notice">
              <div className="readonly-icon">Lock</div>
              <div className="readonly-text">
                <h4>This chat is read-only</h4>
                <p>
                  {chat?.propertyStatus === 'rented' 
                    ? 'This property has been rented. The chat is now read-only for coordination purposes.'
                    : 'Chat has been disabled by the administrator.'}
                </p>
                {chat?.userRole === 'owner' && chat?.propertyStatus === 'rented' && (
                  <p className="owner-note">As the owner, you can still reply to tenant questions.</p>
                )}
              </div>
            </div>
          ) : null}
          
          <div className="input-wrapper">
            {/* Document submission button for tenants */}
            {user?.uid && chat?.userRole === 'tenant' && !chat?.isReadonly && chat?.propertyId && (
              <button 
                type="button" 
                className="input-action-btn document-btn"
                onClick={() => navigate(`/document-submission/${chat.propertyId}`)}
                title="Submit Documents"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </button>
            )}
            
            <button type="button" className="input-action-btn attach-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder={
                  chat?.isReadonly && chat?.userRole !== 'owner'
                    ? "Chat is read-only"
                    : chat?.isReadonly && chat?.userRole === 'owner' && chat?.propertyStatus === 'rented'
                    ? "Type a reply (owner can still message)..."
                    : "Type a message..."
                }
                className="message-input"
                disabled={sendingMessage || (chat?.isReadonly && chat?.userRole !== 'owner')}
              />
            </form>
            <button 
              type="button" 
              className="input-action-btn emoji-btn"
              onClick={() => setShowEmojiPicker(showEmojiPicker === 'input' ? null : 'input')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
              {showEmojiPicker === 'input' && (
                <div className="emoji-picker input-emoji-picker">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      className="emoji-option"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </button>
            <button 
              type="button" 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage || (chat?.isReadonly && chat?.userRole !== 'owner')}
            >
              {sendingMessage ? (
                <div className="sending-spinner"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
