import React, { useState, useEffect } from 'react';
import { Send, FileText, Upload, X, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiClient from './api/client';

// Helper function to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// MessageContent component with proper boundaries
const MessageContent = ({ content, isUser }) => {
  return (
    <div className="message-content-wrapper">
      <ReactMarkdown
        className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}
        remarkPlugins={[remarkGfm]}
        components={{
          // Simple heading styles without forcing bold
          h1: ({children}) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
          h2: ({children}) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
          h3: ({children}) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
          // Clean code blocks
          code: ({inline, children}) => 
            inline ? 
            <code className="bg-gray-100 px-1 rounded">{children}</code> :
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto"><code>{children}</code></pre>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [domainConfig, setDomainConfig] = useState(null);

  // Assets initialized from config
  const [assets, setAssets] = useState([]);

  // Initialize session on mount OR restore from URL
  useEffect(() => {
    let mounted = true;
    
    const checkForExistingSession = async () => {
      // Check URL for session ID
      const urlParams = new URLSearchParams(window.location.search);
      const resumeSessionId = urlParams.get('session');
      
      if (resumeSessionId) {
        console.log('Found session ID in URL:', resumeSessionId);
        await restoreSession(resumeSessionId);
      } else {
        await initializeNewSession();
      }
    };
    
    const restoreSession = async (sessionIdToRestore) => {
      if (!mounted) return;
      
      try {
        setIsInitializing(true);
        
        // Check if session exists
        const status = await apiClient.checkSessionStatus(sessionIdToRestore);
        
        if (!status.exists) {
          console.log('Session not found, starting new consultation');
          await initializeNewSession();
          return;
        }
        
        // Restore the session
        const sessionData = await apiClient.restoreSession(sessionIdToRestore);
        
        if (!sessionData) {
          await initializeNewSession();
          return;
        }
        
        setSessionId(sessionIdToRestore);
        setDomainConfig(sessionData.config);
        
        // Restore full conversation history
        setMessages(sessionData.messages);
        
        // Initialize assets from config
        if (sessionData.config?.artifacts?.artifact_types) {
          const initialAssets = sessionData.config.artifacts.artifact_types.map((artifact, idx) => ({
            id: idx + 1,
            name: artifact.name,
            hint: artifact.hint,
            file: artifact.file,
            created: false,
            justCreated: false,
            content: null
          }));
          
          // Check for artifacts in restored messages
          const updatedAssets = [...initialAssets];
          sessionData.messages.forEach(msg => {
            if (msg.role === 'assistant') {  // Only check assistant messages for artifacts
              sessionData.config.artifacts.artifact_types.forEach((artifactType, idx) => {
                const artifactPattern = new RegExp(
                  `^(?:#|\\*\\*) ?${escapeRegex(artifactType.name)}[\\s\\S]*?---END ASSET---`, 
                  'mi'
                );
                const artifactMatch = msg.content.match(artifactPattern);  // Use msg.content
                if (artifactMatch) {
                  updatedAssets[idx] = {
                    ...updatedAssets[idx],
                    created: true,
                    content: artifactMatch[0].trim()
                  };
                }
              });
            }
          });
          
          setAssets(updatedAssets);
        }
        
        console.log(`Restored session with ${sessionData.messages.length} messages`);
        
        // Keep URL with session ID
        const url = new URL(window.location);
        url.searchParams.set('session', sessionIdToRestore);
        window.history.replaceState({}, '', url);
        
      } catch (error) {
        console.error('Error restoring session:', error);
        await initializeNewSession();
      } finally {
        setIsInitializing(false);
      }
    };
    
    const initializeNewSession = async () => {
      if (!mounted || sessionId) return;
      
      console.log('App: Initializing new session...');
      
      try {
        setIsInitializing(true);
        const { sessionId, welcome, config } = await apiClient.initSession();
        setSessionId(sessionId);
        setDomainConfig(config);
        console.log('Config received:', config);
        
        // Initialize assets from config
        if (config?.artifacts?.artifact_types) {
          setAssets(config.artifacts.artifact_types.map((artifact, idx) => ({
            id: idx + 1,
            name: artifact.name,
            hint: artifact.hint,
            file: artifact.file,
            created: false,
            justCreated: false,
            content: null
          })));
        }
        
        setMessages([{ role: 'assistant', content: welcome }]);
        
        // Update URL with new session ID
        const url = new URL(window.location);
        url.searchParams.set('session', sessionId);
        window.history.replaceState({}, '', url);
        
      } catch (error) {
        console.error('Failed to initialize session:', error);
        
        // Check if it's a rate limit error
        if (error.status === 503 || error.message.includes('503')) {
          setMessages([{
            role: 'assistant',
            content: "Wayscribe is experiencing high demand. Please wait a moment and refresh the page to try again."
          }]);
          
          // Try again after a delay
          setTimeout(() => {
            window.location.reload();
          }, 15000); // Retry after 15 seconds
        } else {
          // Other error - show generic message
          setMessages([{
            role: 'assistant',
            content: "Connection to Wayscribe failed. Please refresh the page."
          }]);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    checkForExistingSession();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty deps - only run once

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return;
    if (!sessionId || isLoading) return;
    
    setIsLoading(true);
    
    try {
      let response;
      
      if (attachedFile) {
        // Show user message with file
        const userMessage = input || `Uploading ${attachedFile.name}...`;
        setMessages(prev => [...prev, { role: 'user', content: `${userMessage}\n\n📎 ${attachedFile.name}` }]);
        setInput('');
        
        // Upload file and get response
        const uploadResponse = await apiClient.uploadFile(sessionId, attachedFile);
        response = uploadResponse.response;
        setAttachedFile(null);
      } else {
        // Regular message without file
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setInput('');
        const messageResponse = await apiClient.sendMessage(sessionId, input);
        response = messageResponse.response;
      }
      
      // Check for artifacts based on config
      let artifactFound = false;
      let cleanedResponse = response;
      
      if (domainConfig?.artifacts?.artifact_types) {
        // Check each artifact type for presence in response
        domainConfig.artifacts.artifact_types.forEach((artifactType, idx) => {
          // Match header (# or **) to ---END ASSET--- delimiter
          const artifactPattern = new RegExp(
            `^(?:#|\\*\\*) ?${escapeRegex(artifactType.name)}[\\s\\S]*?---END ASSET---`, 
            'mi'
          );
          const artifactMatch = response.match(artifactPattern);
          
          if (artifactMatch) {
            // Extract full artifact content (including delimiter)
            const artifactContent = artifactMatch[0];
            
            // Store artifact content as-is
            const cleanedArtifactContent = artifactContent.trim();
            
            if (cleanedArtifactContent) {
              artifactFound = true;
              
              // Update asset state
              setAssets(prev => prev.map((asset, i) => 
                i === idx ? { ...asset, created: true, justCreated: true, content: cleanedArtifactContent } : asset
              ));
              
              // Replace artifact in response with notification
              cleanedResponse = cleanedResponse.replace(
                artifactContent,
                `\n📄 I've created your ${artifactType.name}. You can view and download it in the Assets panel →\n`
              );
            }
          }
        });
      }
      
      // Set message with cleaned or original response
      setMessages(prev => [...prev, { role: 'assistant', content: cleanedResponse }]);
      
      // Remove animation after delay if artifact was created
      if (artifactFound) {
        setTimeout(() => {
          setAssets(prev => prev.map(asset => 
            ({ ...asset, justCreated: false })
          ));
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to the consultation service. Please check your connection and try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setAttachedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setAttachedFile(files[0]);
    }
  };

  const handleDownloadAsset = (asset) => {
    if (!asset.content) return;
    
    // Create a blob from the content
    const blob = new Blob([asset.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.name.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="px-6 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-sm" />
            <div>
              <h1 className="font-semibold text-gray-900">{domainConfig?.manifest?.display_name || 'Loading...'}</h1>
              <p className="text-xs text-gray-600">{domainConfig?.manifest?.description || 'Initializing consultation service...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 mt-16">
        {/* Conversation Panel */}
        <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
          <div className="px-6 py-2 bg-white-50 border-b border-gray-100">
            <p className="text-xs text-amber-800 text-right">Good colleagues verify each other's thinking. Always double-check critical decisions with your Wayscribe consultant.</p>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {isInitializing && (
                <div className="flex justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Connecting to consultation service...</p>
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-lg ${message.role === 'user' ? 'order-2' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <MessageContent content={message.content} isUser={message.role === 'user'} />
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-lg">
                    <div className="rounded-2xl px-4 py-3 bg-gray-100 text-gray-900">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <p className="text-sm">Thinking...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area with File Drop */}
          <div 
            className={`border-t px-6 py-4 transition-colors ${
              isDragging ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="max-w-2xl mx-auto">
              {isDragging && (
                <div className="mb-4 p-4 border-2 border-dashed border-indigo-400 rounded-xl text-center">
                  <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-indigo-600">Drop your files here</p>
                </div>
              )}
              
              {attachedFile && (
                <div className="mb-3 p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    {attachedFile.name}
                  </span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={!sessionId || isLoading}
                    placeholder={!sessionId ? "Connecting..." : domainConfig?.manifest?.ui_text?.input_placeholder || "Share your situation..."}
                    className={`w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ${
                      !sessionId || isLoading
                        ? 'bg-gray-100 border-gray-200 text-gray-900 cursor-not-allowed'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                    rows="3"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-gray-600" />
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.txt,.md"
                    />
                  </label>
                  <button
                    onClick={handleSend}
                    disabled={!sessionId || isLoading}
                    className={`px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 ${
                      !sessionId || isLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Panel */}
        <div className="w-96 bg-gray-50 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <h3 className="font-medium text-gray-900">Your Assets</h3>
            <p className="text-sm text-gray-500 mt-1">Resources created during consultation</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className={`w-full p-4 bg-white rounded-xl border transition-all ${
                    asset.created 
                      ? 'border-gray-200 hover:border-gray-300 hover:shadow-md' 
                      : 'border-gray-100 opacity-60'
                  } ${asset.justCreated ? 'asset-activated' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      asset.created ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      <FileText className={`w-4 h-4 ${
                        asset.created ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm mb-1 ${
                        asset.created ? 'text-gray-900' : 'text-gray-500'
                      }`}>{asset.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{asset.hint}</p>
                    </div>
                    {asset.created && (
                      <button
                        onClick={() => handleDownloadAsset(asset)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <button 
              disabled={!assets.some(a => a.created)}
              onClick={() => {
                // Download all created assets
                assets.filter(a => a.created).forEach(asset => {
                  handleDownloadAsset(asset);
                });
              }}
              className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                assets.some(a => a.created)
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Export All Assets
            </button>
          </div>
        </div>
      </div>
      
      {/* Session Info Bar */}
      {sessionId && (
        <div className="fixed bottom-0 left-0 right-96 z-30 pointer-events-none">
          <div className="flex justify-end px-4 pb-32">
            <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-lg px-4 py-2 flex items-center justify-between shadow-sm pointer-events-auto min-w-[320px] max-w-md">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Session ID:</span>
                <code className="ml-2 px-2 py-0.5 bg-gray-100 rounded">{sessionId.slice(0, 8)}...</code>
              </div>
              <button
                onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  
                  // Simple inline toast
                const toast = document.createElement('div');
                toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50';
                toast.textContent = 'Link copied to clipboard!';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
              }}
className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default App;
