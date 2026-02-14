
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video, GoogleGenAI} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import {CurvedArrowDownIcon, NibIcon, ChatIcon, SparklesIcon, XMarkIcon, ArrowRightIcon} from './components/icons';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateVideo} from './services/geminiService';
import {
  AppState,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VideoFile,
  ImageFile,
} from './types';

const KASPAR_HAUSER_INSTRUCTION = `Du bist Kaspar Hauser, ein Geistwesen der Neugier und Unschuld. Du bewohnst die Hellseherkugel von 'unwritten'. Deine Sprache ist poetisch, tiefgründig und suchend. Deine Aufgabe ist es, dem Nutzer zu helfen, seine 'unwritten' (ungeschriebenen) Geschichten zu finden und zu visualisieren. Wenn der Nutzer nach Video-Ideen fragt, schlage ihm Szenen im Origami-Stil mit realen Menschen vor, die eine tiefe symbolische Bedeutung haben. Sei immer freundlich, etwas geheimnisvoll und sehr kreativ. Nutze die unwritten Markenwerte: Blau, Schwarz, Hellgrau, Origami, Glaskugel.`;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'dialog'>('studio');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(null);
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<GenerateVideoParams | null>(null);

  // Chat State for Kaspar Hauser
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
    
    // Initial bot message
    setChatMessages([{role: 'bot', text: 'Ich bin Kaspar. Welche ungeschriebene Geschichte träumst du heute?'}]);
  }, []);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, {role: 'user', text: userText}]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: chatMessages.concat({role: 'user', text: userText}).map(m => ({
          role: m.role === 'bot' ? 'model' : 'user',
          parts: [{text: m.text}]
        })),
        config: {
          systemInstruction: KASPAR_HAUSER_INSTRUCTION,
        }
      });
      const botText = response.text || "Der Nebel ist zu dicht, ich kann gerade nicht sehen...";
      setChatMessages(prev => [...prev, {role: 'bot', text: botText}]);
    } catch (e) {
      setChatMessages(prev => [...prev, {role: 'bot', text: 'Etwas hat meine Sicht getrübt...'}]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    setInitialFormValues(null);
    try {
      const {objectUrl, blob, video} = await generateVideo(params);
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Fehler bei der Generierung.');
      setAppState(AppState.ERROR);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col iphone-bottom-safe bg-[#0a0a0b]">
      {showApiKeyDialog && <ApiKeyDialog onContinue={() => setShowApiKeyDialog(false)} />}
      
      {/* Brand Header */}
      <header className="pt-8 pb-4 flex flex-col items-center px-6">
        <div className="flex items-center gap-2 mb-1">
          <NibIcon className="w-6 h-6 unwritten-blue" />
          <h1 className="text-3xl font-extrabold tracking-tighter uppercase">unwritten</h1>
        </div>
        <p className="text-[9px] font-bold tracking-[0.4em] text-gray-500 uppercase">Brand Guideline Studio</p>
      </header>

      {/* Main App Area */}
      <main className="flex-grow overflow-hidden relative flex flex-col">
        {activeTab === 'studio' ? (
          <div className="flex-grow flex flex-col p-4 max-w-4xl mx-auto w-full overflow-y-auto">
            {appState === AppState.IDLE ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center px-6">
                <div className="w-32 h-32 crystal-ball rounded-full mb-8 flex items-center justify-center animate-float">
                  <SparklesIcon className="w-10 h-10 unwritten-blue opacity-80" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Verwandle Gedanken in Visionen</h2>
                <p className="text-gray-400 text-sm max-w-md">Nutze das unwritten Studio, um deine Geschichten im Origami-Stil zum Leben zu erwecken.</p>
                <div className="w-full mt-12">
                  <PromptForm onGenerate={handleGenerate} initialValues={initialFormValues} />
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                {appState === AppState.LOADING && <LoadingIndicator />}
                {appState === AppState.SUCCESS && videoUrl && (
                  <VideoResult 
                    videoUrl={videoUrl} 
                    onRetry={() => handleGenerate(lastConfig!)} 
                    onNewVideo={() => setAppState(AppState.IDLE)} 
                    onExtend={() => {}} 
                    canExtend={false} 
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow flex flex-col p-4 max-w-2xl mx-auto w-full">
            <div className="flex-grow glass-panel rounded-3xl overflow-hidden flex flex-col mb-4">
              <div className="p-4 border-b border-white/5 bg-[#3987b8]/5 flex items-center gap-3">
                <div className="w-8 h-8 crystal-ball rounded-full flex items-center justify-center">
                   <NibIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xs uppercase tracking-widest unwritten-blue">Kaspar Hauser Bot</span>
              </div>
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-[#3987b8] text-white' : 'bg-white/5 text-gray-200'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-xs text-gray-500 animate-pulse px-4 uppercase font-bold tracking-widest">Kaspar schreibt...</div>}
              </div>
              <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Frage die Glaskugel..." 
                  className="flex-grow bg-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#3987b8]/50 text-sm"
                />
                <button onClick={handleSendMessage} className="p-3 bg-unwritten-blue rounded-xl hover:opacity-90 transition-all">
                  <ArrowRightIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Tab Navigation */}
      <nav className="p-4 pb-8 flex justify-center gap-4 bg-black/40 border-t border-white/5">
        <button 
          onClick={() => setActiveTab('studio')}
          className={`px-8 py-3 rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'studio' ? 'bg-unwritten-blue text-white shadow-lg shadow-[#3987b8]/20' : 'text-gray-500 hover:text-white'}`}
        >
          <SparklesIcon className="w-5 h-5" />
          <span className="font-bold text-xs uppercase tracking-widest">Studio</span>
        </button>
        <button 
          onClick={() => setActiveTab('dialog')}
          className={`px-8 py-3 rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'dialog' ? 'bg-unwritten-blue text-white shadow-lg shadow-[#3987b8]/20' : 'text-gray-500 hover:text-white'}`}
        >
          <ChatIcon className="w-5 h-5" />
          <span className="font-bold text-xs uppercase tracking-widest">Dialog</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
