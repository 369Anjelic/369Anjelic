
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  VeoModel,
  VideoFile,
} from '../types';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FilmIcon,
  FramesModeIcon,
  PlusIcon,
  RectangleStackIcon,
  ReferencesModeIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  XMarkIcon,
} from './icons';

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.ANIMATE_IMAGE]: <SparklesIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: (
    <ReferencesModeIcon className="w-5 h-5" />
  ),
  [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

interface MotionPreset {
  id: string;
  label: string;
  prompt: string;
}

const ANIMATION_PRESETS: MotionPreset[] = [
  { 
    id: 'page_turn', 
    label: 'Turn Page', 
    prompt: 'The person in the scene smoothly turns a page of the book, followed immediately by turning another page in the same direction. Maintain the serene atmosphere and paper-cut art style.' 
  },
  { 
    id: 'gentle_sway', 
    label: 'Gentle Sway', 
    prompt: 'Add a subtle, cinematic swaying motion to the foreground elements, as if caught in a very light breeze. Keep the focus sharp on the central character.' 
  },
  { 
    id: 'dynamic_zoom', 
    label: 'Deep Zoom', 
    prompt: 'A slow, dramatic camera zoom-in toward the subject, creating a sense of intimacy and depth while preserving all fine details.' 
  },
  { 
    id: 'particle_flow', 
    label: 'Floating Particles', 
    prompt: 'Tiny particles of light and dust float gently across the frame, catching the light and adding a magical atmosphere to the scene.' 
  }
];

const fileToBase64 = <T extends {file: File; base64: string}>(
  file: File,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        resolve({file, base64} as T);
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
const fileToImageFile = (file: File): Promise<ImageFile> =>
  fileToBase64<ImageFile>(file);
const fileToVideoFile = (file: File): Promise<VideoFile> =>
  fileToBase64<VideoFile>(file);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div>
    <label
      className={`text-[10px] uppercase tracking-widest block mb-1.5 font-bold ${
        disabled ? 'text-gray-600' : 'text-gray-500'
      }`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        {icon}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-8 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:bg-gray-800/20 disabled:text-gray-600 transition-all outline-none">
        {children}
      </select>
      <ChevronDownIcon
        className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          disabled ? 'text-gray-700' : 'text-gray-500'
        }`}
      />
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onSelect: (image: ImageFile) => void;
  onRemove?: () => void;
  image?: ImageFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, image, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onSelect(imageFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (image) {
    return (
      <div className="relative w-32 h-24 group animate-in fade-in zoom-in duration-300">
        <img
          src={URL.createObjectURL(image.file)}
          alt="preview"
          className="w-full h-full object-cover rounded-xl border border-white/10 shadow-lg"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
          aria-label="Remove image">
          <XMarkIcon className="w-4 h-4" strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-32 h-24 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-indigo-400 transition-all hover:border-indigo-500/50">
      <PlusIcon className="w-6 h-6" />
      <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </button>
  );
};

const VideoUpload: React.FC<{
  onSelect: (video: VideoFile) => void;
  onRemove?: () => void;
  video?: VideoFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, video, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const videoFile = await fileToVideoFile(file);
        onSelect(videoFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
  };

  if (video) {
    return (
      <div className="relative w-48 h-28 group">
        <video
          src={URL.createObjectURL(video.file)}
          muted
          loop
          className="w-full h-full object-cover rounded-xl border border-white/10"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Remove video">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-48 h-28 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-indigo-400 transition-all text-center">
      <PlusIcon className="w-6 h-6" />
      <span className="text-[10px] mt-1 font-bold uppercase tracking-wider px-2">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
    </button>
  );
};

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  initialValues,
}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(
    initialValues?.model ?? VeoModel.VEO_FAST,
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialValues?.aspectRatio ?? AspectRatio.LANDSCAPE,
  );
  const [resolution, setResolution] = useState<Resolution>(
    initialValues?.resolution ?? Resolution.P720,
  );
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO,
  );
  const [startFrame, setStartFrame] = useState<ImageFile | null>(
    initialValues?.startFrame ?? null,
  );
  const [endFrame, setEndFrame] = useState<ImageFile | null>(
    initialValues?.endFrame ?? null,
  );
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>(
    initialValues?.referenceImages ?? [],
  );
  const [styleImage, setStyleImage] = useState<ImageFile | null>(
    initialValues?.styleImage ?? null,
  );
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(
    initialValues?.inputVideo ?? null,
  );
  const [inputVideoObject, setInputVideoObject] = useState<Video | null>(
    initialValues?.inputVideoObject ?? null,
  );
  const [isLooping, setIsLooping] = useState(initialValues?.isLooping ?? false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt ?? '');
      setModel(initialValues.model ?? VeoModel.VEO_FAST);
      setAspectRatio(initialValues.aspectRatio ?? AspectRatio.LANDSCAPE);
      setResolution(initialValues.resolution ?? Resolution.P720);
      setGenerationMode(initialValues.mode ?? GenerationMode.TEXT_TO_VIDEO);
      setStartFrame(initialValues.startFrame ?? null);
      setEndFrame(initialValues.endFrame ?? null);
      setReferenceImages(initialValues.referenceImages ?? []);
      setStyleImage(initialValues.styleImage ?? null);
      setInputVideo(initialValues.inputVideo ?? null);
      setInputVideoObject(initialValues.inputVideoObject ?? null);
      setIsLooping(initialValues.isLooping ?? false);
    }
  }, [initialValues]);

  useEffect(() => {
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      setModel(VeoModel.VEO);
      setAspectRatio(AspectRatio.LANDSCAPE);
      setResolution(Resolution.P720);
    } else if (generationMode === GenerationMode.EXTEND_VIDEO) {
      setResolution(Resolution.P720);
    }
  }, [generationMode]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeSelectorRef.current &&
        !modeSelectorRef.current.contains(event.target as Node)
      ) {
        setIsModeSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onGenerate({
        prompt,
        model,
        aspectRatio,
        resolution,
        mode: generationMode,
        startFrame,
        endFrame,
        referenceImages,
        styleImage,
        inputVideo,
        inputVideoObject,
        isLooping,
      });
    },
    [
      prompt,
      model,
      aspectRatio,
      resolution,
      generationMode,
      startFrame,
      endFrame,
      referenceImages,
      styleImage,
      inputVideo,
      inputVideoObject,
      onGenerate,
      isLooping,
    ],
  );

  const handleSelectMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
    setIsModeSelectorOpen(false);
    setStartFrame(null);
    setEndFrame(null);
    setReferenceImages([]);
    setStyleImage(null);
    setInputVideo(null);
    setInputVideoObject(null);
    setIsLooping(false);
  };

  const applyPreset = (preset: MotionPreset) => {
    setPrompt(preset.prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const promptPlaceholder = {
    [GenerationMode.TEXT_TO_VIDEO]: 'Describe your cinematic vision...',
    [GenerationMode.ANIMATE_IMAGE]:
      'Describe the movement (e.g. "She turns the page of the book smoothly")...',
    [GenerationMode.REFERENCES_TO_VIDEO]:
      'Describe a scene using these visual anchors...',
    [GenerationMode.EXTEND_VIDEO]: 'Describe what happens next in the scene...',
  }[generationMode];

  const selectableModes = [
    GenerationMode.TEXT_TO_VIDEO,
    GenerationMode.ANIMATE_IMAGE,
    GenerationMode.REFERENCES_TO_VIDEO,
  ];

  const renderMediaUploads = () => {
    if (generationMode === GenerationMode.ANIMATE_IMAGE) {
      return (
        <div className="mb-4 p-6 glass-panel rounded-2xl flex flex-col items-center justify-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-center gap-6">
            <ImageUpload
              label="Source Image"
              image={startFrame}
              onSelect={setStartFrame}
              onRemove={() => {
                setStartFrame(null);
                setIsLooping(false);
              }}
            />
            {!isLooping && (
              <ImageUpload
                label="End Frame"
                image={endFrame}
                onSelect={setEndFrame}
                onRemove={() => setEndFrame(null)}
              />
            )}
          </div>
          {startFrame && (
            <div className="mt-2 flex items-center bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/loop">
              <input
                id="loop-video-checkbox"
                type="checkbox"
                checked={isLooping}
                onChange={(e) => {
                  setIsLooping(e.target.checked);
                  if (e.target.checked) setEndFrame(null);
                }}
                className="w-4 h-4 text-indigo-500 bg-black border-white/20 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="loop-video-checkbox"
                className="ml-2 text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer select-none group-hover/loop:text-gray-200 transition-colors">
                Loop Animation
              </label>
            </div>
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      return (
        <div className="mb-4 p-6 glass-panel rounded-2xl flex flex-wrap items-center justify-center gap-3 animate-in slide-in-from-bottom-4 duration-500">
          {referenceImages.map((img, index) => (
            <ImageUpload
              key={index}
              image={img}
              label=""
              onSelect={() => {}}
              onRemove={() =>
                setReferenceImages((imgs) => imgs.filter((_, i) => i !== index))
              }
            />
          ))}
          {referenceImages.length < 3 && (
            <ImageUpload
              label="Style Reference"
              onSelect={(img) => setReferenceImages((imgs) => [...imgs, img])}
            />
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      return (
        <div className="mb-4 p-6 glass-panel rounded-2xl flex items-center justify-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <VideoUpload
            label="Base Video"
            video={inputVideo}
            onSelect={setInputVideo}
            onRemove={() => {
              setInputVideo(null);
              setInputVideoObject(null);
            }}
          />
        </div>
      );
    }
    return null;
  };

  const isRefMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;
  const isExtendMode = generationMode === GenerationMode.EXTEND_VIDEO;
  const isAnimateMode = generationMode === GenerationMode.ANIMATE_IMAGE;

  let isSubmitDisabled = false;
  let tooltipText = '';

  switch (generationMode) {
    case GenerationMode.TEXT_TO_VIDEO:
      isSubmitDisabled = !prompt.trim();
      if (isSubmitDisabled) tooltipText = 'Please enter a description.';
      break;
    case GenerationMode.ANIMATE_IMAGE:
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) tooltipText = 'Upload a starting image.';
      break;
    case GenerationMode.REFERENCES_TO_VIDEO:
      const hasNoRefs = referenceImages.length === 0;
      const hasNoPrompt = !prompt.trim();
      isSubmitDisabled = hasNoRefs || hasNoPrompt;
      if (hasNoRefs && hasNoPrompt) tooltipText = 'Add references and a description.';
      else if (hasNoRefs) tooltipText = 'Add at least one reference image.';
      else if (hasNoPrompt) tooltipText = 'Please enter a description.';
      break;
    case GenerationMode.EXTEND_VIDEO:
      isSubmitDisabled = !inputVideoObject;
      if (isSubmitDisabled) tooltipText = 'Extension requires a base video.';
      break;
  }

  return (
    <div className="relative w-full">
      {isSettingsOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-4 p-6 glass-panel rounded-3xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CustomSelect
              label="Engine"
              value={model}
              onChange={(e) => setModel(e.target.value as VeoModel)}
              icon={<SparklesIcon className="w-4 h-4 text-indigo-400" />}
              disabled={isRefMode}>
              {Object.values(VeoModel).map((modelValue) => (
                <option key={modelValue} value={modelValue}>
                  {modelValue.replace('veo-3.1-', '').replace('-preview', '').toUpperCase()}
                </option>
              ))}
            </CustomSelect>
            <CustomSelect
              label="Format"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              icon={<RectangleStackIcon className="w-4 h-4 text-indigo-400" />}
              disabled={isRefMode || isExtendMode}>
              {Object.entries(aspectRatioDisplayNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name.split(' (')[0].toUpperCase()}
                </option>
              ))}
            </CustomSelect>
            <div>
              <CustomSelect
                label="Quality"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as Resolution)}
                icon={<TvIcon className="w-4 h-4 text-indigo-400" />}
                disabled={isRefMode || isExtendMode}>
                <option value={Resolution.P720}>720P (Standard)</option>
                <option value={Resolution.P1080}>1080P (High)</option>
              </CustomSelect>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full">
        {renderMediaUploads()}
        <div className="mb-2">
          <div className="flex items-end gap-3 glass-panel rounded-[2rem] p-3 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all border border-white/5">
            <div className="relative" ref={modeSelectorRef}>
              <button
                type="button"
                onClick={() => setIsModeSelectorOpen((prev) => !prev)}
                className="flex shrink-0 items-center gap-2 px-4 py-3 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all"
                aria-label="Select generation mode">
                {modeIcons[generationMode]}
                <span className="font-bold text-[10px] uppercase tracking-widest whitespace-nowrap hidden sm:inline">
                  {generationMode}
                </span>
              </button>
              {isModeSelectorOpen && (
                <div className="absolute bottom-full mb-3 w-64 glass-panel rounded-2xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                  {selectableModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleSelectMode(mode)}
                      className={`w-full text-left flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${generationMode === mode ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
                      {modeIcons[mode]}
                      <span className="font-bold text-xs uppercase tracking-widest">{mode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={promptPlaceholder}
              className="flex-grow bg-transparent focus:outline-none resize-none text-base text-gray-100 placeholder-gray-600 max-h-48 py-3 leading-relaxed"
              rows={1}
            />
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`p-3.5 rounded-full hover:bg-white/10 transition-all ${isSettingsOpen ? 'bg-white/10 text-indigo-400 shadow-inner' : 'text-gray-400'}`}
              aria-label="Settings">
              <SlidersHorizontalIcon className="w-5 h-5" />
            </button>
            <div className="relative group">
              <button
                type="submit"
                className="p-3.5 bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                aria-label="Generate video"
                disabled={isSubmitDisabled}>
                <ArrowRightIcon className="w-6 h-6 text-white" />
              </button>
              {isSubmitDisabled && tooltipText && (
                <div
                  role="tooltip"
                  className="absolute bottom-full right-0 mb-3 w-max max-w-xs px-4 py-2 bg-black border border-white/10 text-white text-[10px] uppercase font-bold tracking-widest rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30">
                  {tooltipText}
                </div>
              )}
            </div>
          </div>
          {isAnimateMode && startFrame && (
            <div className="mt-3 flex flex-wrap gap-2 px-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] self-center mr-1">Presets:</span>
              {ANIMATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="preset-chip">
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PromptForm;
