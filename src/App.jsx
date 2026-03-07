import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import {
  Settings,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Volume2,
  Save,
  Upload,
  Download,
  MoreHorizontal,
  X,
  Image as ImageIcon,
  MessageSquare,
  LayoutGrid,
  Zap,
  Search,
  Loader2,
  Key,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  WifiOff,
  Check,
  AlertCircle,
  Play,
  Delete,
  ArrowRightCircle,
  Type,
  FilePlus,
  Share,
  VolumeX,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  MapPin,
  BrainCircuit,
  GripVertical,
  RefreshCw,
  Layers,
  Globe,
  Link,
  ShieldCheck,
  EyeOff
} from 'lucide-react';
import MagicBar from './components/MagicBar';
import OnboardingWizard from './components/OnboardingWizard';
import WhatsNewModal from './components/WhatsNewModal';
import { NEXT_WORD_PREDICTIONS } from './services/ai';

/**
 * Zip EasySpeak AAC
 * Developed by Zip Solutions
 */

// --- FIREBASE INITIALIZATION ---
const getFirebaseConfig = () => {
  try {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  } catch (error) {
    return {
      apiKey: "preview-only",
      authDomain: "preview-only",
      projectId: "preview-only",
      storageBucket: "preview-only",
      messagingSenderId: "preview-only",
      appId: "preview-only"
    };
  }
};

const firebaseConfig = getFirebaseConfig();
const fbApp = initializeApp(firebaseConfig);
const fbAuth = getAuth(fbApp);
const fbDb = getFirestore(fbApp);


// --- Keyboard Generators ---
const getKeyboardTiles = (type) => {
  const layouts = {
    qwerty: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'],
    abc: ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ']
  };
  const rows = layouts[type] || layouts.qwerty;
  let tiles = [];
  
  rows.forEach((rowStr, rIndex) => {
    rowStr.split('').forEach(char => {
      tiles.push({ id: `k_${char}`, label: char, phrase: char, image: char, type: 'emoji', color: 'bg-white', row: rIndex });
    });
  });
  
  // Bottom Controls Row
  const bottomRow = rows.length;
  tiles.push({ id: 't_numbers', label: '123', phrase: '', image: '123', type: 'emoji', color: 'bg-slate-200', linkToPage: 'p_numbers', isSilent: true, row: bottomRow });
  tiles.push({ id: 't_space', label: 'Space', phrase: ' ', image: '␣', type: 'emoji', color: 'bg-yellow-200', row: bottomRow });
  tiles.push({ id: 't_period', label: '.', phrase: '.', image: '.', type: 'emoji', color: 'bg-yellow-200', row: bottomRow });
  tiles.push({ id: 't_question', label: '?', phrase: '?', image: '?', type: 'emoji', color: 'bg-yellow-200', row: bottomRow });
  tiles.push({ id: 't_backspace', label: 'Delete', phrase: 'Delete', image: '⌫', type: 'emoji', color: 'bg-red-200', row: bottomRow });
  tiles.push({ id: 't_back_home', label: 'Home', phrase: '', image: '🏠', type: 'emoji', color: 'bg-blue-100', linkToPage: 'p_core', isSilent: true, row: bottomRow });
  
  return tiles;
};

const getNumbersTiles = () => {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9']
  ];
  let tiles = [];
  
  rows.forEach((row, rIndex) => {
    row.forEach(char => {
      tiles.push({ id: `n_${char}`, label: char, phrase: char, image: char, type: 'emoji', color: 'bg-white', row: rIndex });
    });
  });
  
  // Controls Row
  tiles.push({ id: 't_abc', label: 'ABC', phrase: '', image: 'ABC', type: 'emoji', color: 'bg-slate-200', linkToPage: 'p_keyboard', isSilent: true, row: 3 });
  tiles.push({ id: 'n_0', label: '0', phrase: '0', image: '0', type: 'emoji', color: 'bg-white', row: 3 });
  tiles.push({ id: 't_backspace', label: 'Delete', phrase: 'Delete', image: '⌫', type: 'emoji', color: 'bg-red-200', row: 3 });
  
  // Final Action Row
  tiles.push({ id: 't_space', label: 'Space', phrase: ' ', image: '␣', type: 'emoji', color: 'bg-yellow-200', row: 4 });
  tiles.push({ id: 't_back_home', label: 'Home', phrase: '', image: '🏠', type: 'emoji', color: 'bg-blue-100', linkToPage: 'p_core', isSilent: true, row: 4 });
  
  return tiles;
};

// --- Constants ---
const LOCATIONS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'school', label: 'School', icon: '🏫' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'outside', label: 'Outside', icon: '🌳' },
  { id: 'store', label: 'Store', icon: '🛒' },
  { id: 'hospital', label: 'Hospital', icon: '🏥' },
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'airport', label: 'Airport', icon: '✈️' },
  { id: 'train', label: 'Train Station', icon: '🚆' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
  { id: 'conference', label: 'Conference', icon: '🎤' },
];

// --- EXPANDED Default Configuration Data ---
const APP_VERSION = 4;
const DEFAULT_CONFIG = {
  version: APP_VERSION,
  settings: {
    voiceURI: null,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    adminPin: "",
    openSymbolsSecret: "",
    gridSize: "auto",
    offlineOnly: false,
    onboardingComplete: false,
    aiContext: "",
    theme: "system",
    enableSentenceBuilder: true,
    enableTimeContext: true,
    speakOnSelect: false,
    speakOnSpace: true,
    clearOnSpeak: false, 
    showLabels: true,
    keyboardLayout: "qwerty",
  },
  pages: [
    {
      id: "p_core",
      label: "Core",
      icon: "🏠",
      color: "bg-blue-100",
      type: "local",
      hidden: false,
      tiles: [
        { id: "c1", label: "I", phrase: "I", image: "🧍", type: "emoji", color: "bg-yellow-200", linkToPage: "", isSilent: false, variants: ["I", "me", "my", "mine"] },
        { id: "c2", label: "Want", phrase: "want", image: "🤲", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["want", "wants", "wanted", "wanting"] },
        { id: "c3", label: "Stop", phrase: "Stop it", image: "🛑", type: "emoji", color: "bg-pink-200", linkToPage: "", isSilent: false },
        { id: "c4", label: "More", phrase: "more", image: "➕", type: "emoji", color: "bg-white", linkToPage: "", isSilent: false },
        { id: "c5", label: "Yes", phrase: "Yes", image: "👍", type: "emoji", color: "bg-white", linkToPage: "", isSilent: false },
        { id: "c6", label: "No", phrase: "No", image: "👎", type: "emoji", color: "bg-white", linkToPage: "", isSilent: false },
        { id: "c7", label: "Help", phrase: "Help", image: "🆘", type: "emoji", color: "bg-pink-200", linkToPage: "", isSilent: false, variants: ["help", "helping", "helped"] },
        { id: "c8", label: "Like", phrase: "like", image: "❤️", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["like", "likes", "liking", "liked"] },
        { id: "c9", label: "Don't", phrase: "don't", image: "🚫", type: "emoji", color: "bg-red-200", linkToPage: "", isSilent: false },
        { id: "c10", label: "Good", phrase: "good", image: "😊", type: "emoji", color: "bg-blue-200", linkToPage: "", isSilent: false },
        { id: "c11", label: "Bad", phrase: "bad", image: "☹️", type: "emoji", color: "bg-blue-200", linkToPage: "", isSilent: false },
        { id: "c12", label: "It", phrase: "it", image: "📦", type: "emoji", color: "bg-yellow-200", linkToPage: "", isSilent: false },
        { id: "t_kb_link", label: "Type", phrase: "", image: "⌨️", type: "emoji", color: "bg-slate-200", linkToPage: "p_keyboard", isSilent: true },
      ]
    },
    {
      id: "p_actions",
      label: "Actions",
      icon: "🏃",
      color: "bg-green-50",
      type: "local",
      hidden: false,
      tiles: [
        { id: "a1", label: "Go", phrase: "go", image: "🚶", type: "emoji", color: "bg-green-200", linkToPage: "p_places", isSilent: false, variants: ["go", "goes", "going", "went"] },
        { id: "a2", label: "Play", phrase: "play", image: "🎮", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["play", "plays", "playing", "played"] },
        { id: "a3", label: "Look", phrase: "look", image: "👀", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["look", "looks", "looking", "looked"] },
        { id: "a4", label: "Listen", phrase: "listen", image: "👂", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["listen", "listens", "listening", "listened"] },
        { id: "a5", label: "Make", phrase: "make", image: "🛠️", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["make", "makes", "making", "made"] },
        { id: "a6", label: "Get", phrase: "get", image: "👐", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["get", "gets", "getting", "got"] },
        { id: "a7", label: "Open", phrase: "open", image: "🔓", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["open", "opens", "opening", "opened"] },
        { id: "a8", label: "Close", phrase: "close", image: "🔒", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["close", "closes", "closing", "closed"] },
        { id: "a9", label: "Come", phrase: "come", image: "👋", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["come", "comes", "coming", "came"] },
        { id: "a10", label: "Put", phrase: "put", image: "📥", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["put", "puts", "putting"] },
        { id: "a11", label: "Give", phrase: "give", image: "🎁", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["give", "gives", "giving", "gave"] },
        { id: "a12", label: "Wash", phrase: "wash", image: "🧼", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["wash", "washes", "washing", "washed"] },
        { id: "a13", label: "Read", phrase: "read", image: "📖", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["read", "reads", "reading"] },
      ]
    },
    {
      id: "p_food",
      label: "Food",
      icon: "🍔",
      color: "bg-orange-50",
      type: "local",
      hidden: false,
      tiles: [
        { id: "f1", label: "Eat", phrase: "eat", image: "🍽️", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["eat", "eats", "eating", "ate"] },
        { id: "f2", label: "Drink", phrase: "drink", image: "🚰", type: "emoji", color: "bg-green-200", linkToPage: "", isSilent: false, variants: ["drink", "drinks", "drinking", "drank"] },
        { id: "f3", label: "Water", phrase: "water", image: "💧", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
        { id: "f4", label: "Apple", phrase: "apple", image: "🍎", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false, variants: ["apple", "apples"] },
        { id: "f5", label: "Banana", phrase: "banana", image: "🍌", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false, variants: ["banana", "bananas"] },
        { id: "f6", label: "Cookie", phrase: "cookie", image: "🍪", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false, variants: ["cookie", "cookies"] },
        { id: "f7", label: "Pizza", phrase: "pizza", image: "🍕", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
        { id: "f8", label: "Juice", phrase: "juice", image: "🧃", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
        { id: "f9", label: "Milk", phrase: "milk", image: "🥛", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
        { id: "f10", label: "Snack", phrase: "snack", image: "🥨", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false, variants: ["snack", "snacks"] },
        { id: "f11", label: "Crackers", phrase: "crackers", image: "🍘", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
        { id: "f12", label: "Cheese", phrase: "cheese", image: "🧀", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
        { id: "f13", label: "Bread", phrase: "bread", image: "🍞", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
        { id: "f14", label: "Chicken", phrase: "chicken", image: "🍗", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
        { id: "f15", label: "Candy", phrase: "candy", image: "🍬", type: "emoji", color: "bg-orange-200", linkToPage: "", isSilent: false },
      ]
    },
    {
      id: "p_places",
      label: "Places",
      icon: "🗺️",
      color: "bg-purple-50",
      type: "local",
      hidden: false,
      tiles: [
        { id: "pl1", label: "Home", phrase: "home", image: "🏠", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl2", label: "School", phrase: "school", image: "🏫", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl3", label: "Park", phrase: "park", image: "🏞️", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl4", label: "Store", phrase: "store", image: "🛒", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl5", label: "Bathroom", phrase: "bathroom", image: "🚽", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl6", label: "Car", phrase: "car", image: "🚗", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl7", label: "Doctor", phrase: "doctor", image: "🩺", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl8", label: "Outside", phrase: "outside", image: "🌳", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl9", label: "Bus", phrase: "bus", image: "🚌", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl10", label: "Room", phrase: "room", image: "🚪", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl11", label: "Bed", phrase: "bed", image: "🛏️", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
        { id: "pl12", label: "Kitchen", phrase: "kitchen", image: "🍳", type: "emoji", color: "bg-purple-200", linkToPage: "", isSilent: false },
      ]
    },
    {
      id: "p_routines",
      label: "Tasks",
      icon: "📅",
      color: "bg-teal-50",
      type: "local",
      hidden: false,
      tiles: [
        { id: "r1", label: "Wash Hands", phrase: "wash hands", image: "🧼", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false, variants: ["wash hands", "washing hands", "washed hands"] },
        { id: "r2", label: "Brush Teeth", phrase: "brush teeth", image: "🪥", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false, variants: ["brush teeth", "brushing teeth", "brushed teeth"] },
        { id: "r3", label: "Bath", phrase: "bath", image: "🛁", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false },
        { id: "r4", label: "Toilet", phrase: "toilet", image: "🚽", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false },
        { id: "r5", label: "Dress", phrase: "get dressed", image: "👕", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false, variants: ["get dressed", "getting dressed"] },
        { id: "r6", label: "Sleep", phrase: "sleep", image: "🛌", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false, variants: ["sleep", "sleeps", "sleeping", "slept"] },
        { id: "r7", label: "Clean up", phrase: "clean up", image: "🧹", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false, variants: ["clean up", "cleaning up"] },
        { id: "r8", label: "Homework", phrase: "homework", image: "📝", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false },
        { id: "r9", label: "Backpack", phrase: "backpack", image: "🎒", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false },
        { id: "r10", label: "Shoes on", phrase: "put shoes on", image: "👟", type: "emoji", color: "bg-teal-200", linkToPage: "", isSilent: false },
      ]
    },
    {
      id: "p_keyboard",
      label: "Keyboard",
      icon: "⌨️",
      color: "bg-slate-100",
      type: "local",
      hidden: false,
      tiles: getKeyboardTiles("qwerty")
    },
    {
      id: "p_numbers",
      label: "Numbers",
      icon: "1️⃣",
      color: "bg-slate-100",
      type: "local",
      hidden: false,
      tiles: getNumbersTiles()
    }
  ]
};

const STORAGE_KEY = 'zip_easyspeak_config';
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateDeviceId = () => {
    let id = localStorage.getItem('zip_device_id');
    if (!id) {
        id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('zip_device_id', id);
    }
    return id;
};

// --- TILE COMPONENT ---
const Tile = React.memo(({ 
  tile, 
  onClick, 
  editMode, 
  isKeyboardKey, 
  isPredicted, 
  showLabels, 
  onLongPress, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onEdit, 
  onDelete,
  isManagedPage
}) => {
  const hasVariants = tile.variants && tile.variants.length > 0;
  
  // Robust Universal Long Press Logic 
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);
  const pointerStartPos = useRef({ x: 0, y: 0 });

  const handlePressStart = (e) => {
    if (editMode) return;
    if (e.type === 'mousedown' && e.button !== 0) return;

    isLongPress.current = false;
    
    if (e.touches && e.touches.length > 0) {
        pointerStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
        pointerStartPos.current = { x: e.clientX, y: e.clientY };
    }

    if (hasVariants) {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      
      pressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(tile);
        if (navigator.vibrate) {
            try { navigator.vibrate(50); } catch(err) {}
        }
      }, 500); 
    }
  };

  const handlePressMove = (e) => {
      if (!pressTimer.current) return;

      let currentX, currentY;
      if (e.touches && e.touches.length > 0) {
          currentX = e.touches[0].clientX;
          currentY = e.touches[0].clientY;
      } else {
          currentX = e.clientX;
          currentY = e.clientY;
      }

      const diffX = Math.abs(currentX - pointerStartPos.current.x);
      const diffY = Math.abs(currentY - pointerStartPos.current.y);

      if (diffX > 15 || diffY > 15) {
          handlePressCancel();
      }
  };

  const handlePressCancel = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = (e) => {
    if (editMode) return;
    
    if (isLongPress.current) {
        e.preventDefault();
        e.stopPropagation();
        isLongPress.current = false; 
        return;
    }
    
    onClick(tile);
  };

  return (
    <div
      draggable={editMode && !isManagedPage}
      onDragStart={(e) => onDragStart(e, tile)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, tile)}
      
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressCancel}
      onTouchMove={handlePressMove}
      onTouchCancel={handlePressCancel}
      
      onMouseDown={handlePressStart}
      onMouseUp={handlePressCancel}
      onMouseMove={handlePressMove}
      onMouseLeave={handlePressCancel}
      
      onClick={handleClick}
      
      onContextMenu={(e) => {
        if (!editMode && hasVariants) {
          e.preventDefault(); 
          if (!isLongPress.current) {
              isLongPress.current = true;
              onLongPress(tile);
          }
        }
      }}
      
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}

      className={`relative group flex flex-col items-center justify-center shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all cursor-pointer select-none overflow-hidden ${tile.color} border-black/10 hover:brightness-95
      ${isKeyboardKey ? 'aspect-[4/5] sm:aspect-square rounded-xl sm:rounded-2xl' : 'aspect-square rounded-2xl'}
      ${isPredicted ? 'ring-4 ring-yellow-400 ring-offset-2 z-10 scale-105' : ''}
      ${editMode && !isManagedPage ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      <div className="flex-1 min-h-0 w-full flex items-center justify-center p-1 pointer-events-none">
        {tile.type === 'image' ? (
          <img src={tile.image} alt={tile.label} className="max-w-full max-h-full object-contain pointer-events-none" />
        ) : (
          <span className={`${isKeyboardKey ? 'text-2xl sm:text-5xl md:text-6xl text-slate-900 dark:text-slate-900' : 'text-5xl md:text-6xl text-slate-900 dark:text-slate-900'} select-none pointer-events-none`}>{tile.image}</span>
        )}
      </div>
      {showLabels && (
        <div className={`w-full shrink-0 text-center py-1 px-1 bg-white/30 backdrop-blur-sm font-bold text-gray-800 ${isKeyboardKey ? 'hidden sm:flex text-sm md:text-base' : 'flex text-sm md:text-base'} truncate items-center justify-center gap-1 pointer-events-none`}>
          {tile.label}
          {tile.linkToPage && <ArrowRightCircle size={12} className="text-blue-600 opacity-70" />}
          {tile.isSilent && editMode && <VolumeX size={12} className="text-red-500 opacity-70" />}
        </div>
      )}
      
      {hasVariants && !editMode && (
         <div className="absolute bottom-1.5 right-1.5 flex gap-1 pointer-events-none opacity-80">
           <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-slate-900 rounded-full pointer-events-none shadow-sm"></div>
           <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-slate-900 rounded-full pointer-events-none shadow-sm"></div>
           <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-slate-900 rounded-full pointer-events-none shadow-sm"></div>
         </div>
      )}

      {isPredicted && (
        <div className="absolute top-2 right-2 text-yellow-600 animate-pulse pointer-events-none">
          <Sparkles size={20} fill="currentColor" />
        </div>
      )}
      
      {/* Hidden block if it's a managed page so teachers can't edit it locally */}
      {editMode && !isManagedPage && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          <div className="absolute top-2 left-2 p-1 bg-white/50 rounded text-slate-600 cursor-grab pointer-events-auto">
            <GripVertical size={16} />
          </div>
          <button onClick={(e) => { e.stopPropagation(); onEdit(tile); }} className="p-3 bg-white rounded-full shadow-lg hover:bg-blue-50 text-blue-600 mr-2 pointer-events-auto"><Edit2 size={20} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(tile.id); }} className="p-3 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-600 pointer-events-auto"><Trash2 size={20} /></button>
        </div>
      )}
    </div>
  );
});


export default function App() {
  // --- Firebase & Linking State ---
  const [deviceId] = useState(generateDeviceId);
  const [linkedStudentId, setLinkedStudentId] = useState(() => localStorage.getItem('zip_student_id') || null);
  const [isPairing, setIsPairing] = useState(false);
  const [appPairingCode, setAppPairingCode] = useState(null);
  const [remoteLockTrigger, setRemoteLockTrigger] = useState(0);

  // Use a ref to prevent infinite sync loops between upward and downward syncs
  const lastUploadedLocalPages = useRef('');
  const lastUploadedPin = useRef();

  // Authenticate Anonymously for Firebase Access
  useEffect(() => {
      signInAnonymously(fbAuth).catch(console.error);
  }, []);

  // --- Version Tracking ---
  const [showWhatsNew, setShowWhatsNew] = useState(() => {
      try {
          const saved = localStorage.getItem('zip_easyspeak_config');
          if (saved) return (JSON.parse(saved).version || 1) < APP_VERSION;
      } catch (e) {}
      return false;
  });

  // --- Main Config State ---
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        let upgradedPages = Array.isArray(parsed.pages) ? [...parsed.pages] : [...DEFAULT_CONFIG.pages];
        
        upgradedPages.forEach(p => {
            if (!p.type) p.type = 'local'; 
            if (p.hidden === undefined) p.hidden = false; 
            (p.tiles || []).forEach(t => {
                if (t.linkToPage === 'p_qwerty_full') t.linkToPage = 'p_keyboard';
                if (!t.variants || t.variants.length === 0) {
                    if (t.label === 'I') t.variants = ["I", "me", "my", "mine"];
                    else if (t.label === 'Want') t.variants = ["want", "wants", "wanted", "wanting"];
                    else if (t.label === 'Apple') t.variants = ["apple", "apples"];
                    else if (t.label === 'Banana') t.variants = ["banana", "bananas"];
                    else if (t.label === 'Cookie') t.variants = ["cookie", "cookies"];
                    else t.variants = []; 
                }
            });
        });
        
        if (!upgradedPages.some(p => p.id === 'p_keyboard')) upgradedPages.push(DEFAULT_CONFIG.pages.find(p => p.id === 'p_keyboard'));
        if (!upgradedPages.some(p => p.id === 'p_numbers')) upgradedPages.push(DEFAULT_CONFIG.pages.find(p => p.id === 'p_numbers'));

        upgradedPages = upgradedPages.filter(p => p.id !== 'p_qwerty_full');

        return { ...DEFAULT_CONFIG, ...parsed, version: APP_VERSION, settings: { ...DEFAULT_CONFIG.settings, ...(parsed.settings || {}) }, pages: upgradedPages };
      }
    } catch (e) {
      console.error("Failed to load config", e);
    }
    return DEFAULT_CONFIG;
  });

  // --- Firebase Downward Sync Effect ---
  useEffect(() => {
    if (!linkedStudentId) return;
    
    const studentRef = doc(fbDb, 'students', linkedStudentId);

    // Initial heartbeat
    updateDoc(studentRef, { 
      status: 'online', 
      lastSync: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    }).catch(e => console.warn(e));

    const unsub = onSnapshot(studentRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Handle Unlinking initiated by the Teacher Dashboard
        if (data.device === 'Unlinked') {
           setLinkedStudentId(null);
           localStorage.removeItem('zip_student_id');
           setConfig(prev => ({ ...prev, pages: prev.pages.filter(p => p.type !== 'managed') }));
           alert("This device has been unlinked by the school.");
           return;
        }

        setConfig(prev => {
          const localPages = prev.pages.filter(p => p.type !== 'managed');
          const managedPages = (data.pages || []).filter(p => p.type === 'managed');
          
          // Re-map keyboard links just in case
          managedPages.forEach(p => {
             (p.tiles || []).forEach(t => {
                 if (t.linkToPage === 'p_qwerty_full') t.linkToPage = 'p_keyboard';
             });
          });
          
          // --- Handle Remote Admin PIN Lockout ---
          let newSettings = prev.settings;
          const remotePin = data.adminPin !== undefined ? data.adminPin : (data.pin !== undefined ? data.pin : undefined);
          
          if (remotePin !== undefined && remotePin !== prev.settings.adminPin) {
             newSettings = { ...prev.settings, adminPin: remotePin };
             // If PIN was applied remotely, trigger the lockout
             if (remotePin.length > 0) {
                 setRemoteLockTrigger(Date.now());
             }
          }

          return { ...prev, settings: newSettings, pages: [...localPages, ...managedPages] };
        });

      } else {
        // Ignore false-negatives from the offline cache during initialization
        if (docSnap.metadata && docSnap.metadata.fromCache) return;

        // Profile deleted entirely
        setLinkedStudentId(null);
        localStorage.removeItem('zip_student_id');
      }
    });

    return () => unsub();
  }, [linkedStudentId]);

  // --- Sync Local Changes UP to Firebase ---
  useEffect(() => {
    if (!linkedStudentId) return;

    // Filter local pages and serialize them to string for strict comparison
    const localPages = config.pages.filter(p => p.type !== 'managed');
    const serializedLocal = JSON.stringify(localPages);

    // CRITICAL FIX: Do not trigger an upload unless the local state actually changed.
    // This stops the infinite sync loop with the downward listener.
    if (serializedLocal === lastUploadedLocalPages.current) {
        return;
    }

    const timer = setTimeout(() => {
        const studentRef = doc(fbDb, 'students', linkedStudentId);
        getDoc(studentRef).then(snap => {
            if (snap.exists()) {
                const existingManaged = (snap.data().pages || []).filter(p => p.type === 'managed');
                // Push merged state
                updateDoc(studentRef, {
                    pages: [...existingManaged, ...localPages],
                    lastSync: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                }).then(() => {
                    // Save successful upload payload to block duplicate uploads
                    lastUploadedLocalPages.current = serializedLocal;
                }).catch(e => console.error("Upload sync error", e));
            }
        });
    }, 2000); // 2-second debounce

    return () => clearTimeout(timer);
  }, [config.pages, linkedStudentId]);

  // --- Sync App Settings UP to Firebase ---
  useEffect(() => {
    if (!linkedStudentId) return;

    const currentPin = config.settings.adminPin || "";
    
    // CRITICAL FIX: Block infinite sync loop by not updating if the pin hasn't genuinely changed locally
    if (currentPin === lastUploadedPin.current) {
        return;
    }

    const timer = setTimeout(() => {
        const studentRef = doc(fbDb, 'students', linkedStudentId);
        
        updateDoc(studentRef, {
            adminPin: currentPin,
            pin: currentPin, // Push to legacy field as well
            lastSync: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
        }).then(() => {
            // Save successful upload payload
            lastUploadedPin.current = currentPin;
        }).catch(e => console.error("Upload pin sync error", e));
    }, 1500); // 1.5-second debounce

    return () => clearTimeout(timer);
  }, [config.settings.adminPin, linkedStudentId]);


  const [activePageId, setActivePageId] = useState(() => config.pages[0].id);
  const [timeContext, setTimeContext] = useState(''); 
  const [locationContext, setLocationContext] = useState('Home');
  const [draggedTile, setDraggedTile] = useState(null);
  const [draggedPage, setDraggedPage] = useState(null);
  const [activeMorphology, setActiveMorphology] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [sentence, setSentence] = useState([]); 
  const [accessToken, setAccessToken] = useState(null); 

  // --- UI State ---
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [editingTile, setEditingTile] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinContext, setPinContext] = useState(null);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fileInputRef = useRef(null);
  const mergeInputRef = useRef(null);

  // Contexts
  const activePage = config.pages.find(p => p.id === activePageId) || config.pages[0];

  // --- Force Lockout on Remote PIN Update ---
  useEffect(() => {
      if (remoteLockTrigger > 0) {
          setIsEditMode(false);
          setShowSettings(false);
          setPinPrompt(false);
      }
  }, [remoteLockTrigger]);

  // --- Handle exiting Edit Mode on a Hidden Page ---
  useEffect(() => {
      // If we exit edit mode, and the current page is hidden, safely route to the first visible page
      if (!isEditMode && activePage?.hidden) {
          const firstVisible = config.pages.find(p => !p.hidden);
          if (firstVisible && firstVisible.id !== activePageId) {
              setActivePageId(firstVisible.id);
          }
      }
  }, [isEditMode, activePage, config.pages, activePageId]);

  // --- Global Tile Aggregation for Predictions ---
  const globalTiles = useMemo(() => {
      const all = [];
      const seen = new Set();
      config.pages.forEach(page => {
          (page.tiles || []).forEach(tile => {
              const text = tile.phrase.toLowerCase();
              if (!tile.isSilent && !tile.id.startsWith('k_') && !tile.id.startsWith('n_') && !seen.has(text)) {
                  seen.add(text);
                  all.push(tile);
              }
          });
      });
      return all;
  }, [config.pages]);

  // Find which global tiles match the next word predictions
  const predictedNextTiles = useMemo(() => {
      if (sentence.length === 0) return [];
      
      const lastWord = sentence[sentence.length - 1].phrase.toLowerCase();
      const predictedWords = NEXT_WORD_PREDICTIONS[lastWord] || [];
      
      if (predictedWords.length === 0) return [];

      const matchingTiles = predictedWords.map(word => {
          return globalTiles.find(t => t.phrase.toLowerCase() === word) || null;
      }).filter(Boolean); 

      return matchingTiles.slice(0, 8); 
  }, [sentence, globalTiles]);


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const updateTimeContext = () => {
        if (!config.settings.enableTimeContext) {
            setTimeContext('');
            return;
        }
        const h = new Date().getHours();
        if (h >= 5 && h < 12) setTimeContext('morning');
        else if (h >= 12 && h < 18) setTimeContext('afternoon');
        else setTimeContext('evening');
    };
    
    updateTimeContext();
    const interval = setInterval(updateTimeContext, 60000 * 5);
    return () => clearInterval(interval);
  }, [config.settings.enableTimeContext]); 

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // --- Theme Effect ---
  useEffect(() => {
    const root = window.document.documentElement;
    const theme = config.settings.theme || 'system';

    const applyTheme = (isDark) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(systemQuery.matches);
      
      const handleChange = (e) => applyTheme(e.matches);
      systemQuery.addEventListener('change', handleChange);
      return () => systemQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [config.settings.theme]);

  // --- Actions ---
  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.settings.rate;
    utterance.pitch = config.settings.pitch;
    utterance.volume = config.settings.volume;
    if (config.settings.voiceURI) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === config.settings.voiceURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleTileClick = (tile) => {
    const isSilent = tile.isSilent === true;
    const isTypingPage = activePageId === 'p_keyboard' || activePageId === 'p_numbers';

    if (isTypingPage) {
        if (tile.id === 't_backspace') {
            setSentence(prev => {
                if (prev.length === 0) return prev;
                const newArr = [...prev];
                const lastIndex = newArr.length - 1;
                const last = newArr[lastIndex];
                if (last.isTyped && last.phrase.length > 0) {
                    const newText = last.phrase.slice(0, -1);
                    if (newText.length === 0) return newArr.slice(0, -1); 
                    newArr[lastIndex] = { ...last, label: newText, phrase: newText };
                    return newArr;
                }
                return newArr.slice(0, -1);
            });
            return;
        }
        
        if (tile.id === 't_space') {
            setSentence(prev => {
                if (prev.length === 0) return prev;
                const newArr = [...prev];
                const last = newArr[newArr.length - 1];
                if (last && last.isTyped) {
                    if (config.settings.speakOnSpace !== false) speak(last.phrase);
                    last.isTyped = false; 
                }
                return newArr;
            });
            return;
        }

        if (!isSilent) {
            if (tile.phrase.length === 1 || tile.id.startsWith('k_') || tile.id.startsWith('n_')) {
                 setSentence(prev => {
                    const newArr = [...prev];
                    const lastIndex = newArr.length - 1;
                    if (lastIndex >= 0 && newArr[lastIndex].isTyped) {
                        const last = newArr[lastIndex];
                        newArr[lastIndex] = { 
                            ...last, 
                            label: last.label + tile.label, 
                            phrase: last.phrase + tile.phrase 
                        };
                        return newArr;
                    }
                    return [...prev, { ...tile, isTyped: true }];
                 });
            } else {
                setSentence(prev => [...prev, tile]);
            }
            if (config.settings.speakOnSelect) speak(tile.phrase); 
        }
    } else if (!isSilent) {
      if (config.settings.enableSentenceBuilder) {
        setSentence(prev => [...prev, tile]);
        if (config.settings.speakOnSelect) speak(tile.phrase);
      } else {
        speak(tile.phrase);
      }
    }

    if (tile.linkToPage && tile.linkToPage !== "") {
      const targetPage = config.pages.find(p => p.id === tile.linkToPage);
      if (targetPage) setActivePageId(targetPage.id);
    }
  };

  const handleVariantSelect = (variantString) => {
    const variantTile = {
        ...activeMorphology,
        id: activeMorphology.id + '_' + variantString,
        label: variantString,
        phrase: variantString
    };
    handleTileClick(variantTile);
    setActiveMorphology(null);
  };

  const getIsPredicted = (tileLabel) => {
    if (sentence.length === 0) return false;
    const lastWord = sentence[sentence.length - 1].phrase.toLowerCase();
    const predictions = NEXT_WORD_PREDICTIONS[lastWord];
    return predictions && predictions.includes(tileLabel.toLowerCase());
  };

  const clearSentence = () => setSentence([]);
  const removeLastWord = () => setSentence(prev => prev.slice(0, -1));

  const playSentence = () => {
    if (sentence.length === 0) return;
    const fullText = sentence.map(t => t.phrase).join(" ");
    speak(fullText);
    if (config.settings.clearOnSpeak) clearSentence();
  };
  
  const speakMagicPrediction = (text) => {
    speak(text);
    if (config.settings.clearOnSpeak) clearSentence();
  };

  const getFullContext = () => {
      let parts = [];
      if (timeContext) parts.push(timeContext);
      if (locationContext) parts.push(`at ${locationContext}`);
      return parts.join(' ');
  };

  // --- Device Pairing Flow ---
  const handleGeneratePairingCode = async () => {
    setIsPairing(true);
    // Generate 10 char code
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed O,0,1,I for clarity
    let code = '';
    for (let i=0; i<10; i++) code += charset.charAt(Math.floor(Math.random() * charset.length));
    
    setAppPairingCode(code);
    
    // --- Device Detection Helper ---
    const getDeviceName = () => {
        const ua = navigator.userAgent;
        if (/iPad/i.test(ua)) return "iPad";
        if (/iPhone/i.test(ua)) return "iPhone";
        if (/Mac/i.test(ua)) return "MacBook / iMac";
        if (/Android/i.test(ua)) return "Android Device";
        if (/Windows/i.test(ua)) return "Windows PC";
        if (/CrOS/i.test(ua)) return "Chromebook";
        return "Linked Device";
    };

    try {
      const codeRef = doc(fbDb, 'pairing_codes', code);
      // Save code and device type to temp table
      await setDoc(codeRef, {
        deviceId,
        status: 'pending',
        deviceName: getDeviceName(),
        createdAt: new Date().toISOString()
      });

      // Listen for dashboard to approve
      const unsub = onSnapshot(codeRef, (docSnap) => {
        const data = docSnap.data();
        if (data && data.status === 'linked' && data.studentId) {
           setLinkedStudentId(data.studentId);
           localStorage.setItem('zip_student_id', data.studentId);
           setIsPairing(false);
           setAppPairingCode(null);
           unsub();
           alert("Successfully connected to school district!");
        }
      });
    } catch(e) {
      console.error("Pairing Error:", e);
      alert("Failed to generate linking code.");
      setIsPairing(false);
    }
  };


  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, item, type) => {
    if (!isEditMode) return;
    e.dataTransfer.setData('text/plain', item.id); 
    e.dataTransfer.effectAllowed = 'move';
    if (type === 'tile') setDraggedTile(item);
    else if (type === 'page') setDraggedPage(item);
  };

  const handleDragOver = (e) => {
    if (!isEditMode) return;
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTileDrop = (e, targetTile) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData('text/plain') || (draggedTile && draggedTile.id);
    if (!draggedId || draggedId === targetTile.id) return;

    setConfig(prev => {
      const newPages = prev.pages.map(page => {
        if (page.id === activePageId) {
          const tiles = [...page.tiles];
          const draggedIndex = tiles.findIndex(t => t.id === draggedId);
          const targetIndex = tiles.findIndex(t => t.id === targetTile.id);
          
          if (draggedIndex !== -1 && targetIndex !== -1) {
            const [movedItem] = tiles.splice(draggedIndex, 1);
            tiles.splice(targetIndex, 0, movedItem);
            return { ...page, tiles };
          }
        }
        return page;
      });
      return { ...prev, pages: newPages };
    });
    setDraggedTile(null);
  };

  const handlePageDrop = (e, targetPage) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData('text/plain') || (draggedPage && draggedPage.id);
    if (!draggedId || draggedId === targetPage.id) return;

    setConfig(prev => {
      const pages = [...prev.pages];
      const draggedIndex = pages.findIndex(p => p.id === draggedId);
      const targetIndex = pages.findIndex(p => p.id === targetPage.id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [movedPage] = pages.splice(draggedIndex, 1);
        pages.splice(targetIndex, 0, movedPage);
      }
      return { ...prev, pages };
    });
    setDraggedPage(null);
  };

  // --- Settings Updating ---
  const updateSetting = (key, val) => setConfig(prev => ({ ...prev, settings: { ...prev.settings, [key]: val } }));

  const updateKeyboardLayoutSetting = (newLayout) => {
    setConfig(prev => {
        const newPages = prev.pages.map(p => {
            if (p.id === 'p_keyboard') {
                return { ...p, tiles: getKeyboardTiles(newLayout) };
            }
            return p;
        });
        return { ...prev, settings: { ...prev.settings, keyboardLayout: newLayout }, pages: newPages };
    });
  };

  const forceAppReload = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) { registration.unregister(); }
        });
    }
    if ('caches' in window) {
        caches.keys().then((names) => {
            for (let name of names) caches.delete(name);
        });
    }
    setTimeout(() => { window.location.reload(true); }, 500);
  };

  // CRUD Helpers
  const addTile = () => {
    const newTile = { id: generateId(), label: "New", phrase: "New", image: "⬜", type: "emoji", color: "bg-white", linkToPage: "", isSilent: false, variants: [] };
    setConfig(p => ({ ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, tiles: [...(pg.tiles || []), newTile] } : pg) }));
  };
  const updateTile = (t) => {
    setConfig(p => ({ ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, tiles: (pg.tiles || []).map(ti => ti.id === t.id ? t : ti) } : pg) }));
    setEditingTile(null);
  };
  const deleteTile = (tid) => {
    setConfig(p => ({ ...p, pages: p.pages.map(pg => pg.id === activePageId ? { ...pg, tiles: (pg.tiles || []).filter(ti => ti.id !== tid) } : pg) }));
    setEditingTile(null);
  };
  const addPage = () => {
    const newPage = { id: generateId(), label: "New Page", icon: "📄", color: "bg-gray-100", type: "local", hidden: false, tiles: [] };
    setConfig(p => ({ ...p, pages: [...p.pages, newPage] }));
    setActivePageId(newPage.id);
  };
  const updatePage = (up) => {
    setConfig(p => ({ ...p, pages: p.pages.map(pg => pg.id === up.id ? up : pg) }));
    setEditingPage(null);
    setDeleteConfirm(false);
  };
  const deletePage = (pid) => {
    if (config.pages.length <= 1) return;
    const newPages = config.pages.filter(p => p.id !== pid);
    let nextId = activePageId;
    if (activePageId === pid) nextId = newPages[0].id;
    setActivePageId(nextId);
    setConfig(p => ({ ...p, pages: newPages }));
    setEditingPage(null);
    setDeleteConfirm(false);
  };

  const displayedVoices = config.settings.offlineOnly ? availableVoices.filter(v => v.localService) : availableVoices;
  const showLabels = config.settings.showLabels !== false;
  const isManagedPage = activePage?.type === 'managed';
  
  const isCustomRowLayout = (activePage?.id === 'p_keyboard' || activePage?.id === 'p_numbers') && (activePage?.tiles || []).some(t => t.row !== undefined);

  const getGridClass = () => {
    const s = config.settings.gridSize;
    if (s === 2) return "grid-cols-2";
    if (s === 3) return "grid-cols-3";
    if (s === 4) return "grid-cols-4";
    if (s === 6) return "grid-cols-6";
    if (s === 8) return "grid-cols-8";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
  };

  // --- Proxy Data Exchanges ---
  const downloadJSON = (data, filename) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const handleExport = () => downloadJSON(config, "zip_easyspeak_backup.json");
  const handleExportPage = (page) => downloadJSON({ version: 1, settings: config.settings, pages: [page] }, `page_${page.label.replace(/\s+/g, '_').toLowerCase()}.json`);
  const handleImport = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported.pages && Array.isArray(imported.pages)) { setConfig(imported); setActivePageId(imported.pages[0].id); alert("Full backup restored!"); }
        else alert("Invalid config.");
      } catch (err) { alert("Error parsing file."); }
    };
  };
  const handleMergeImport = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported.pages && Array.isArray(imported.pages)) {
          const newPages = imported.pages.map(p => config.pages.some(existing => existing.id === p.id) ? { ...p, id: generateId(), label: `${p.label} (Imported)` } : p);
          setConfig(prev => ({ ...prev, pages: [...prev.pages, ...newPages] }));
          alert(`Success! Added ${newPages.length} page(s).`);
        } else alert("Invalid file.");
      } catch (err) { alert("Error parsing file."); }
    };
  };
  const handleFactoryReset = () => {
    if (window.confirm("WARNING: Wiping all pages and settings! Are you sure?")) { setConfig(DEFAULT_CONFIG); setPinPrompt(false); setPinInput(""); setPinContext(null); }
  };
  const requestAccess = (context) => {
    // Treat empty string/spaces as no PIN, anything else requires a PIN
    // Cast to String to handle numeric PINs arriving from Firebase
    const adminPin = config.settings.adminPin !== undefined && config.settings.adminPin !== null ? String(config.settings.adminPin) : "";
    if (adminPin.trim() !== '') { 
       setPinContext(context); 
       setPinPrompt(true); 
    } else { 
       if (context === 'edit') setIsEditMode(true); 
       if (context === 'settings') setShowSettings(true); 
    }
  };
  const verifyPin = () => {
    const adminPin = config.settings.adminPin !== undefined && config.settings.adminPin !== null ? String(config.settings.adminPin) : "";
    if (pinInput === adminPin) { 
       setPinPrompt(false); 
       setPinInput(""); 
       if (pinContext === 'edit') setIsEditMode(true); 
       if (pinContext === 'settings') setShowSettings(true); 
       setPinContext(null); 
    } else { 
       alert("Incorrect PIN"); 
       setPinInput(""); 
    }
  };
  const getProxyUrl = (url) => `/api/proxy?url=${encodeURIComponent(url)}`;
  const getImageProxyUrl = (url) => `/api/proxy?url=${encodeURIComponent(url)}`;
  const fetchAuthToken = async () => {
    let secret = config.settings.openSymbolsSecret;
    try { if (import.meta && import.meta.env) { if (!secret) secret = import.meta.env.VITE_OPENSYMBOLS_TOKEN || ""; } } catch (e) { }
    if (!secret) throw new Error("Missing Shared Secret.");
    try {
      const proxyRes = await fetch("/api/token", { method: 'POST', body: (() => { const fd = new FormData(); fd.append('secret', secret.trim()); return fd;})() });
      if (!proxyRes.ok) throw new Error(`Auth Failed: ${proxyRes.status}`);
      const data = await proxyRes.json();
      if (data.access_token) return data.access_token;
      throw new Error("No 'access_token' in response.");
    } catch (e) { throw e; }
  };
  const searchSymbols = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true); setSearchResults([]);
    try {
      let token = accessToken;
      if (!token) { try { token = await fetchAuthToken(); setAccessToken(token); } catch (e) { console.log(e); } }
      let target = `https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(searchQuery)}`;
      if (token) target += `&access_token=${token}`;
      const res = await fetch(getProxyUrl(target));
      if (!res.ok) throw new Error(`API Error`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) { alert(`Search failed: ${error.message}`); }
    finally { setIsSearching(false); }
  };
  const selectSymbol = async (url) => {
    setIsDownloading(true);
    try {
      const res = await fetch(getImageProxyUrl(url)); const blob = await res.blob(); const reader = new FileReader();
      reader.onloadend = () => { setEditingTile(prev => ({ ...prev, type: 'image', image: reader.result })); setShowImageSearch(false); setIsDownloading(false); setIsSearching(false); };
      reader.readAsDataURL(blob);
    } catch (e) { setEditingTile(prev => ({ ...prev, type: 'image', image: url })); setShowImageSearch(false); setIsDownloading(false); setIsSearching(false); }
  };

  const isTypingPage = activePageId === 'p_keyboard' || activePageId === 'p_numbers';

  return (
    <div className={`min-h-screen ${isTypingPage ? 'bg-slate-100 dark:bg-slate-900' : (activePage.color + ' dark:bg-slate-900') || 'bg-slate-50 dark:bg-slate-900'} font-sans text-slate-800 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden`}>

      {!config.settings.onboardingComplete && (
          <div className="absolute inset-0 z-[100] bg-white text-slate-900">
             <OnboardingWizard 
                 currentConfig={config}
                 onUpdateConfig={(updates) => setConfig(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }))}
                 isPairing={isPairing}
                 appPairingCode={appPairingCode}
                 onPairRequest={handleGeneratePairingCode}
                 onCancelPairing={() => {
                     setIsPairing(false);
                     setAppPairingCode(null);
                 }}
                 onComplete={() => console.log('Onboarding complete')}
             />
          </div>
      )}

      {showWhatsNew && !isPairing && config.settings.onboardingComplete && (
          <WhatsNewModal version="1.1" onClose={() => setShowWhatsNew(false)} />
      )}

      {/* Sidebar */}
      <nav className="w-full md:w-24 md:h-screen bg-white dark:bg-slate-800 shadow-xl flex md:flex-col overflow-x-auto md:overflow-y-auto md:overflow-x-hidden shrink-0 z-20 transition-colors">
        <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-slate-100 mb-2">
          <img src="/pwa-192x192.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm mb-1 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Zip</span>
        </div>
        <div className="p-2 md:p-4 flex md:flex-col items-center gap-2">
          {config.pages.filter(page => isEditMode || !page.hidden).map(page => (
            <div
              key={page.id}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, page, 'page')}
              onDragOver={handleDragOver}
              onDrop={(e) => handlePageDrop(e, page)}
              className="relative"
            >
              <button onClick={() => setActivePageId(page.id)} className={`relative flex flex-col items-center justify-center p-2 rounded-xl w-20 h-20 md:w-16 md:h-16 shrink-0 transition-all ${activePageId === page.id ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md scale-105' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'} ${isEditMode ? 'cursor-grab' : ''} ${page.hidden ? 'opacity-60 grayscale bg-slate-200 dark:bg-slate-800' : ''}`}>
                {page.type === 'managed' && <ShieldCheck size={14} className={`absolute top-1 left-1 ${activePageId === page.id ? 'text-blue-200' : 'text-blue-500'}`} />}
                {page.hidden && <EyeOff size={14} className="absolute top-1 right-1 text-slate-400" />}
                <span className="text-2xl mb-1">{page.icon}</span>
                <span className="text-[10px] font-bold truncate max-w-full leading-tight">{page.label}</span>
              </button>
              {isEditMode && !page.hidden && (
                <div className="absolute top-0 right-0 p-1 bg-white/80 rounded-full shadow-sm pointer-events-none">
                  <GripVertical size={12} className="text-slate-400" />
                </div>
              )}
            </div>
          ))}
          {isEditMode && (
            <button onClick={addPage} className="flex flex-col items-center justify-center p-2 rounded-xl w-20 h-20 md:w-16 md:h-16 shrink-0 bg-green-100 text-green-700 hover:bg-green-200 border-2 border-dashed border-green-300">
              <Plus size={24} /> <span className="text-[10px] font-bold mt-1">Add</span>
            </button>
          )}
        </div>
        <div className="md:mt-auto p-2 md:p-4 border-t border-slate-100 flex md:flex-col items-center justify-center gap-3">
          <button onClick={() => isEditMode ? setIsEditMode(false) : requestAccess('edit')} className={`p-3 rounded-full ${isEditMode ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}>
            {isEditMode ? <Unlock size={20} /> : <Lock size={20} />}
          </button>
          <button onClick={() => requestAccess('settings')} className="p-3 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Settings size={20} /></button>
        </div>
      </nav>

      <main className={`flex-1 h-[calc(100vh-80px)] md:h-screen overflow-y-auto p-4 md:p-8 transition-colors ${activePage?.color || 'bg-slate-100'} dark:bg-slate-900`}>

        {/* --- Top Bar: Header or Sentence Strip --- */}
        <div className="mb-6 space-y-4">

          {/* Sentence Strip (Visible if Enabled) */}
          {config.settings.enableSentenceBuilder && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-2 min-h-[80px] flex items-center gap-2 border-2 border-blue-100 dark:border-slate-700 transition-colors">
              <div className="flex-1 flex gap-2 overflow-x-auto p-2">
                {sentence.length === 0 ? (
                  <span className="text-slate-300 italic pl-2 self-center">Build a sentence...</span>
                ) : (
                  sentence.map((t, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 min-w-[60px] h-[60px] transition-colors">
                      <span className="text-xl leading-none mb-1">{t.type === 'emoji' ? t.image : '🖼️'}</span>
                      <span className="text-[10px] font-bold truncate max-w-[60px]">{t.label}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-1 border-l pl-2 border-slate-100 dark:border-slate-700">
                <button onClick={removeLastWord} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl" title="Backspace"><Delete size={24} /></button>
                <button onClick={playSentence} className="p-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 hover:scale-105 transition-all" title="Play"><Play size={24} fill="currentColor" /></button>
              </div>
            </div>
          )}

          {/* --- NEW: Magic Bar with combined Context --- */}
          {config.settings.enableSentenceBuilder && (
            <MagicBar sentence={sentence} onSelect={speakMagicPrediction} context={config.settings.aiContext || getFullContext()} />
          )}

          {/* Page Info & Time/Location Context */}
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
              <img src="/pwa-192x192.png" alt="Logo" className="md:hidden w-8 h-8 rounded-lg shadow-sm object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 truncate">
                  {isManagedPage && <ShieldCheck size={28} className="text-blue-500" title="Managed by School" />}
                  {activePage?.icon || ''} {activePage?.label || 'Page'}
              </h1>
              {isEditMode && !isManagedPage && <button onClick={() => setEditingPage(activePage)} className="p-2 bg-white/50 hover:bg-white rounded-full text-slate-500"><Edit2 size={16} /></button>}
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                
                {/* Location Selector */}
                <div className="flex items-center bg-white/60 rounded-full px-3 py-1.5 border border-white shrink-0">
                    <MapPin size={14} className="text-red-500 mr-2" />
                    <select
                        value={locationContext}
                        onChange={(e) => setLocationContext(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                    >
                        {LOCATIONS.map(loc => <option key={loc.id} value={loc.label}>{loc.icon} {loc.label}</option>)}
                    </select>
                </div>

                {/* Time Context Indicator */}
                {timeContext && (
                    <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-full text-xs text-indigo-600 font-bold uppercase tracking-wider border border-white shrink-0">
                        {timeContext === 'morning' && <><Sun size={14} className="text-orange-500"/> Morning</>}
                        {timeContext === 'afternoon' && <><Sun size={14} className="text-yellow-600"/> Afternoon</>}
                        {timeContext === 'evening' && <><Sunset size={14} className="text-indigo-500"/> Evening</>}
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Read-Only Warning for Managed Pages */}
        {isEditMode && isManagedPage && (
          <div className="w-full text-center mb-6">
            <span className="bg-blue-100 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 max-w-max mx-auto shadow-sm">
               <ShieldCheck size={18} className="text-blue-600"/> School-Managed Page (Read-Only)
            </span>
          </div>
        )}

        {/* --- NEW: Predictive Next Words Strip --- */}
        {config.settings.enableSentenceBuilder && predictedNextTiles.length > 0 && !isCustomRowLayout && (
            <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 ml-1">
                   <Zap size={14} className="text-yellow-500" /> Suggested Next Words
               </h3>
               <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar items-start">
                   {predictedNextTiles.map(tile => (
                       <div key={`pred-${tile.id}`} className="w-[88px] sm:w-24 md:w-28 shrink-0">
                           <Tile 
                               tile={tile}
                               onClick={handleTileClick}
                               editMode={false} // Prevent editing from the prediction row
                               isPredicted={false} // Don't apply the pulse ring here
                               showLabels={showLabels}
                               onLongPress={setActiveMorphology}
                               onDragStart={() => {}}
                               onDragOver={() => {}}
                               onDrop={() => {}}
                               onEdit={() => {}}
                               onDelete={() => {}}
                               isManagedPage={true} // Forces clean tap behavior
                           />
                       </div>
                   ))}
               </div>
               <hr className="border-slate-200 mt-2" />
            </div>
        )}

        {/* Dynamic Grid / Row Layout Render */}
        {isCustomRowLayout ? (
          <div className="flex flex-col gap-2 md:gap-4 pb-20 items-center w-full">
            
            {/* ROTATE PROMPT FOR MOBILE PHONES IN PORTRAIT */}
            <div className="w-full text-center mb-1 sm:hidden landscape:hidden">
              <span className="text-[10px] text-slate-500 font-semibold bg-white/60 rounded-full px-3 py-1 flex items-center justify-center gap-1 inline-flex w-auto border border-white shadow-sm">
                <RefreshCw size={12} className="text-blue-500" /> Rotate device for easier typing
              </span>
            </div>

            {/* Group tiles by row property */}
            {(() => {
              const rows = [];
              (activePage?.tiles || []).forEach(t => {
                const r = t.row || 0;
                if (!rows[r]) rows[r] = [];
                rows[r].push(t);
              });
              
              return Object.values(rows).map((rowTiles, rIdx) => (
                <div key={rIdx} className="flex gap-1 sm:gap-2 md:gap-3 justify-center w-full max-w-5xl px-0.5 sm:px-0">
                   {rowTiles.map(tile => {
                     const isSpace = tile.id === 't_space';
                     return (
                       <div key={tile.id} className={`${isSpace ? 'flex-[2_2_0%]' : 'flex-[1_1_0%]'} sm:max-w-[80px] md:max-w-[100px]`}>
                         <Tile 
                            tile={tile} 
                            onClick={handleTileClick} 
                            editMode={isEditMode} 
                            isKeyboardKey={true} 
                            isPredicted={getIsPredicted(tile.phrase)}
                            showLabels={showLabels}
                            onLongPress={setActiveMorphology}
                            onDragStart={(e, t) => handleDragStart(e, t, 'tile')}
                            onDragOver={handleDragOver}
                            onDrop={(e, t) => handleTileDrop(e, t)}
                            onEdit={setEditingTile}
                            onDelete={deleteTile}
                            isManagedPage={isManagedPage}
                         />
                       </div>
                     );
                   })}
                </div>
              ));
            })()}
            {isEditMode && !isManagedPage && (
              <button onClick={addTile} className="mt-4 w-full max-w-sm h-20 rounded-2xl border-4 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <Plus size={24} /> <span className="font-bold mt-1 text-sm">Add Custom Key</span>
              </button>
            )}
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-4 md:gap-6 pb-20`}>
            {(activePage?.tiles || []).map(tile => (
              <Tile 
                 key={tile.id} 
                 tile={tile} 
                 onClick={handleTileClick} 
                 editMode={isEditMode} 
                 isPredicted={getIsPredicted(tile.phrase)}
                 showLabels={showLabels}
                 onLongPress={setActiveMorphology}
                 onDragStart={(e, t) => handleDragStart(e, t, 'tile')}
                 onDragOver={handleDragOver}
                 onDrop={(e, t) => handleTileDrop(e, t)}
                 onEdit={setEditingTile}
                 onDelete={deleteTile}
                 isManagedPage={isManagedPage}
              />
            ))}
            {isEditMode && !isManagedPage && (
              <button onClick={addTile} className="aspect-square rounded-2xl border-4 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <Plus size={48} /> <span className="font-bold mt-2">Add</span>
              </button>
            )}
          </div>
        )}
      </main>
      
      {/* Morphology / Variants Modal (Triggered by Long Press) */}
      {activeMorphology && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setActiveMorphology(null)}>
             <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-3xl shadow-2xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl flex items-center gap-2 dark:text-slate-100"><Layers className="text-blue-600 dark:text-blue-400" /> Choose Word Form</h3>
                    <button onClick={() => setActiveMorphology(null)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"><X size={20} /></button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Render the variants as large, tappable buttons */}
                    {activeMorphology.variants.map((variant, idx) => (
                        <button 
                           key={idx}
                           onClick={() => handleVariantSelect(variant)}
                           className={`aspect-square flex flex-col items-center justify-center rounded-2xl shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all text-xl md:text-3xl font-bold bg-white dark:bg-slate-700 dark:text-white border-black/10 dark:border-black/30 hover:bg-slate-50 dark:hover:bg-slate-600`}
                        >
                            <span className="text-4xl md:text-5xl mb-2 opacity-50 dark:opacity-80">{activeMorphology.type === 'emoji' ? activeMorphology.image : '🖼️'}</span>
                            {variant}
                        </button>
                    ))}
                </div>
             </div>
          </div>
      )}

      {/* Edit Tile Modal */}
      {editingTile && !showImageSearch && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-lg">Edit Button</h3>
              <button onClick={() => setEditingTile(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Label</label>
                <input type="text" value={editingTile.label} onChange={e => setEditingTile({ ...editingTile, label: e.target.value })} className="w-full p-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phrase</label>
                <textarea value={editingTile.phrase} onChange={e => setEditingTile({ ...editingTile, phrase: e.target.value })} className="w-full p-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-200" rows={2} />
              </div>
              
              {/* NEW: Word Variants for Morphology */}
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <label className="block text-xs font-bold uppercase text-purple-700 mb-1 flex items-center gap-1"><Layers size={14}/> Word Variants (Comma Separated)</label>
                <input 
                    type="text" 
                    value={(editingTile.variants || []).join(', ')} 
                    onChange={e => setEditingTile({ 
                        ...editingTile, 
                        variants: e.target.value.split(',').map(s => s.trim()).filter(s => s !== "") 
                    })} 
                    placeholder="e.g. want, wants, wanted, wanting"
                    className="w-full p-3 border border-purple-200 rounded-lg text-sm bg-white" 
                />
                <p className="text-[10px] text-purple-600 mt-1">If filled, users can <b>long-press</b> this button to choose between these forms.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                  <select value={editingTile.type} onChange={e => setEditingTile({ ...editingTile, type: e.target.value })} className="w-full p-3 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200">
                    <option value="emoji">Emoji</option>
                    <option value="image">Image URL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Color (Fitzgerald Key)</label>
                  <select value={editingTile.color} onChange={e => setEditingTile({ ...editingTile, color: e.target.value })} className="w-full p-3 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white text-sm">
                    <option className="bg-white text-black" value="bg-white">White (Misc/Core)</option>
                    <option className="bg-yellow-200 text-black" value="bg-yellow-200">Yellow (People/Pronouns)</option>
                    <option className="bg-green-200 text-black" value="bg-green-200">Green (Verbs/Actions)</option>
                    <option className="bg-orange-200 text-black" value="bg-orange-200">Orange (Nouns/Things)</option>
                    <option className="bg-blue-200 text-black" value="bg-blue-200">Blue (Adjectives)</option>
                    <option className="bg-pink-200 text-black" value="bg-pink-200">Pink (Social)</option>
                    <option className="bg-purple-200 text-black" value="bg-purple-200">Purple (Questions)</option>
                    <option className="bg-red-200 text-black" value="bg-red-200">Red (Important)</option>
                  </select>
                </div>
              </div>

              {/* Page Linking & Action Tile Features */}
              <div className="bg-blue-50 dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-slate-700 space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><ArrowRightCircle size={12} /> Link to Page</label>
                  <select
                    value={editingTile.linkToPage || ""}
                    onChange={e => setEditingTile({ ...editingTile, linkToPage: e.target.value })}
                    className="w-full p-2 border dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">-- No Link (Stay here) --</option>
                    {config.pages.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Silent Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-blue-800 flex items-center gap-1"><VolumeX size={14} /> Silent (Navigation Only)</label>
                    <p className="text-[10px] text-blue-500">Don't speak or add to sentence</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingTile.isSilent === true}
                    onChange={e => setEditingTile({ ...editingTile, isSilent: e.target.checked })}
                    className="w-5 h-5 accent-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{editingTile.type === 'emoji' ? 'Emoji' : 'Image URL'}</label>
                <div className="flex gap-2">
                  <input type="text" value={editingTile.image} onChange={e => setEditingTile({ ...editingTile, image: e.target.value })} className="flex-1 p-3 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-slate-200" />
                  <button onClick={() => { setSearchQuery(editingTile.label || ""); setShowImageSearch(true); }} className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Search size={20} /></button>
                </div>
              </div>
              
              {/* Optional Row Override for custom keyboards */}
              {isCustomRowLayout && (
                <div>
                   <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Keyboard Row</label>
                   <input type="number" min="0" max="5" value={editingTile.row !== undefined ? editingTile.row : ""} onChange={e => setEditingTile({ ...editingTile, row: parseInt(e.target.value) || 0 })} className="w-full p-3 border rounded-lg text-sm" />
                </div>
              )}

              <button onClick={() => updateTile(editingTile)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Search Modal */}
      {showImageSearch && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden">

            {/* Loading Overlay */}
            {isDownloading && (
              <div className="absolute inset-0 z-[90] bg-white/80 flex flex-col items-center justify-center">
                <Loader2 size={64} className="animate-spin text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">Downloading Image...</h3>
                <p className="text-sm text-slate-500">Please wait while we save it offline.</p>
              </div>
            )}

            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 dark:text-white">
              <h3 className="font-bold text-lg flex items-center gap-2"><Search size={20} className="text-blue-600 dark:text-blue-400" /> Search Symbols</h3>
              <button onClick={() => setShowImageSearch(false)}><X size={20} /></button>
            </div>
            <div className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex gap-2">
                <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchSymbols()} placeholder="Search..." className="flex-1 p-3 border dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-slate-200" />
                <button onClick={searchSymbols} disabled={isSearching} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">{isSearching ? <Loader2 className="animate-spin" /> : "Search"}</button>
              </div>
              <div className="text-xs text-slate-400 mt-2 text-center">Click an image to select it. Images are saved offline.</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
              {Array.isArray(searchResults) && searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {searchResults.map((result) => (
                    <button key={result.id || result.image_url} onClick={() => selectSymbol(result.image_url)} className="aspect-square bg-white rounded-xl shadow-sm border p-2 flex flex-col items-center justify-center hover:ring-2 hover:ring-blue-200 focus:ring-2 focus:ring-blue-400 outline-none">
                      <img src={result.image_url} alt="symbol" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400"><ImageIcon size={48} className="mb-2 opacity-20" /><p>No symbols found yet.</p><p className="text-sm">Try typing a word above.</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Page Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-lg">Edit Page</h3>
              <button onClick={() => { setEditingPage(null); setDeleteConfirm(false); }}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
                <input type="text" value={editingPage.label} onChange={e => setEditingPage({ ...editingPage, label: e.target.value })} className="w-full p-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Icon</label>
                  <input type="text" value={editingPage.icon} onChange={e => setEditingPage({ ...editingPage, icon: e.target.value })} className="w-full p-3 border dark:border-slate-700 rounded-lg text-center dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Theme</label>
                  <select value={editingPage.color} onChange={e => setEditingPage({ ...editingPage, color: e.target.value })} className="w-full p-3 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white">
                    <option className="bg-slate-100 text-black" value="bg-slate-100">Gray</option>
                    <option className="bg-blue-50 text-black" value="bg-blue-50">Blue</option>
                    <option className="bg-green-50 text-black" value="bg-green-50">Green</option>
                    <option className="bg-purple-50 text-black" value="bg-purple-50">Purple</option>
                    <option className="bg-orange-50 text-black" value="bg-orange-50">Orange</option>
                  </select>
                </div>
              </div>
              
              {/* Hide Page Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
                 <div>
                    <div className="font-bold text-sm text-slate-800">Hide Page</div>
                    <p className="text-xs text-slate-500">Hide from students in normal mode</p>
                 </div>
                 <input 
                    type="checkbox" 
                    checked={!!editingPage.hidden} 
                    onChange={e => setEditingPage({ ...editingPage, hidden: e.target.checked })} 
                    className="w-5 h-5 accent-blue-600" 
                 />
              </div>

              <div className="flex gap-2 pt-4">
                {deleteConfirm ? (
                  <div className="flex flex-1 gap-2">
                    <button onClick={() => deletePage(editingPage.id)} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl">Confirm</button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(true)} disabled={config.pages.length <= 1} className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl disabled:opacity-50">Delete</button>
                )}
                {!deleteConfirm && <button onClick={() => updatePage(editingPage)} className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl">Save</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Prompt */}
      {pinPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center dark:text-slate-100">
            <Lock className="mx-auto text-blue-600 dark:text-blue-400 mb-4" size={40} />
            <h3 className="font-bold text-lg mb-2">Enter Admin PIN</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
              {pinContext === 'settings' ? 'Enter PIN to access Settings' : 'Enter PIN to unlock Edit Mode'}
            </p>
            <input type="password" autoFocus value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPin()} className="w-full text-center text-2xl tracking-widest p-3 border dark:border-slate-700 rounded-lg mb-4 dark:bg-slate-800 dark:text-slate-200" placeholder="****" />
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setPinPrompt(false); setPinContext(null); setPinInput(""); }} className="flex-1 py-2 rounded-lg bg-gray-200">Cancel</button>
              <button onClick={verifyPin} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold">Unlock</button>
            </div>
            
            {!linkedStudentId && (
               <button onClick={handleFactoryReset} className="text-red-500 text-xs hover:underline mt-2">Forgot PIN? Factory Reset</button>
            )}
            {linkedStudentId && (
               <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-tight bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                  <ShieldCheck size={12} className="inline mr-1 text-slate-400 dark:text-slate-500" />
                  Device is managed by a school. Local factory reset is disabled.
               </p>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-y-0 right-0 z-40 w-full md:w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20} /> Settings</h2>
            <button onClick={() => setShowSettings(false)} className="hover:text-gray-300"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">

            {/* School Connection Status */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Globe size={16} /> School Connection</h3>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-4">
                {linkedStudentId ? (
                  <div>
                    <div className="flex items-center gap-2 text-green-600 font-bold mb-1">
                        <Check size={18}/> Linked to District
                    </div>
                    <p className="text-xs text-slate-500">This device receives managed pages directly from your school.</p>
                  </div>
                ) : isPairing ? (
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800 mb-2">Show this code to your Teacher:</p>
                    <div className="text-3xl font-mono tracking-widest font-black text-blue-600 mb-4 bg-white py-2 border rounded-lg">
                        {appPairingCode}
                    </div>
                    {appPairingCode && (
                        <div className="flex justify-center mb-4">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${appPairingCode}`} alt="QR Code" className="rounded-lg shadow-sm border p-2 bg-white" />
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-xs mb-4">
                        <Loader2 className="animate-spin" size={14} /> Waiting for teacher...
                    </div>
                    <button onClick={() => { setIsPairing(false); setAppPairingCode(null); }} className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors">Cancel</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">Connect this device to your school district to receive master pages and updates automatically.</p>
                    <button onClick={handleGeneratePairingCode} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors">
                      <Link size={18} /> Link to School
                    </button>
                  </div>
                )}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Visuals */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><LayoutGrid size={16} /> Visuals</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Color Theme</label>
                  <select value={config.settings.theme || "system"} onChange={e => updateSetting('theme', e.target.value)} className="w-full p-2 border dark:border-slate-700 rounded-md text-sm mb-3 dark:bg-slate-800 dark:text-slate-200">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">Use Device Theme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grid Size</label>
                  <select value={config.settings.gridSize || "auto"} onChange={e => updateSetting('gridSize', e.target.value === "auto" ? "auto" : parseInt(e.target.value))} className="w-full p-2 border dark:border-slate-700 rounded-md text-sm dark:bg-slate-800 dark:text-slate-200">
                    <option value="auto">Auto (Responsive)</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                    <option value={6}>6 Columns</option>
                    <option value={8}>8 Columns</option>
                  </select>
                </div>
                
                {/* Keyboard Layout Selection */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium mb-1">Keyboard Layout</label>
                  <select 
                    value={config.settings.keyboardLayout || "qwerty"} 
                    onChange={e => updateKeyboardLayoutSetting(e.target.value)} 
                    className="w-full p-2 border dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="qwerty">QWERTY</option>
                    <option value="abc">ABC</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Changes the built-in keyboard arrangement.</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">Show Button Labels</label>
                    <p className="text-xs text-slate-500">Hide text for a cleaner look</p>
                  </div>
                  <input type="checkbox" checked={config.settings.showLabels !== false} onChange={e => updateSetting('showLabels', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Mode Settings */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><MessageSquare size={16} /> Interaction Mode</h3>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">Sentence Builder</div>
                    <p className="text-xs text-slate-500">Accumulate words in a strip before speaking</p>
                  </div>
                  <input type="checkbox" checked={config.settings.enableSentenceBuilder} onChange={e => updateSetting('enableSentenceBuilder', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                </div>
                
                {/* Nested options that only apply when Sentence Builder is ON */}
                {config.settings.enableSentenceBuilder && (
                  <>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 pl-4">
                      <div>
                        <div className="font-bold text-sm text-blue-700">Clear After Speaking</div>
                        <p className="text-xs text-slate-500">Empty the strip when playing</p>
                      </div>
                      <input type="checkbox" disabled={!config.settings.enableSentenceBuilder} checked={!!config.settings.clearOnSpeak} onChange={e => updateSetting('clearOnSpeak', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 pl-4">
                      <div>
                        <div className="font-bold text-sm">Speak on Select</div>
                        <p className="text-xs text-slate-500">Speak each word as it is added</p>
                      </div>
                      <input type="checkbox" disabled={!config.settings.enableSentenceBuilder} checked={!!config.settings.speakOnSelect} onChange={e => updateSetting('speakOnSelect', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 pl-4">
                      <div>
                        <div className="font-bold text-sm">Speak Typed Words</div>
                        <p className="text-xs text-slate-500">Speak typed words on Space</p>
                      </div>
                      <input type="checkbox" disabled={!config.settings.enableSentenceBuilder} checked={config.settings.speakOnSpace !== false} onChange={e => updateSetting('speakOnSpace', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                    </div>
                  </>
                )}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* AI & Context Settings */}
            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><BrainCircuit size={16} /> AI & Context</h3>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                
                <div>
                  <div className="font-bold text-sm mb-1">Custom Artificial Setup Box</div>
                  <p className="text-xs text-slate-500 mb-2">Instructions the offline AI should know about you.</p>
                  <textarea 
                      value={config.settings.aiContext || ""} 
                      onChange={e => updateSetting('aiContext', e.target.value)} 
                      rows={3}
                      className="w-full p-2 border dark:border-slate-700 rounded-md text-sm dark:bg-slate-900 dark:text-slate-200" 
                      placeholder="e.g. Needs simple language, likes trains, needs to use the bathroom frequently..." 
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">Auto Time Context</div>
                    <p className="text-xs text-slate-500">Detect Morning/Evening automatically</p>
                  </div>
                  <input type="checkbox" checked={config.settings.enableTimeContext} onChange={e => updateSetting('enableTimeContext', e.target.checked)} className="w-5 h-5 accent-blue-600" />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Volume2 size={16} /> Speech</h3>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-800"><WifiOff size={16} /> <span>Offline Voices Only</span></div>
                <input type="checkbox" checked={config.settings.offlineOnly} onChange={e => updateSetting('offlineOnly', e.target.checked)} className="w-5 h-5 accent-blue-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Voice</label>
                  <select value={config.settings.voiceURI || ""} onChange={e => updateSetting('voiceURI', e.target.value)} className="w-full p-2 border dark:border-slate-700 rounded-md text-sm dark:bg-slate-800 dark:text-slate-200">
                    <option value="">Default Device Voice</option>
                    {displayedVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Rate</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={config.settings.rate} onChange={e => updateSetting('rate', parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pitch</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={config.settings.pitch} onChange={e => updateSetting('pitch', parseFloat(e.target.value))} className="w-full" />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Lock size={16} /> Security</h3>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-transparent dark:border-slate-700">
                <label className="block text-sm font-medium mb-1">Local Admin PIN</label>
                <input 
                   type="text" 
                   value={config.settings.adminPin || ""} 
                   onChange={e => updateSetting('adminPin', e.target.value)} 
                   placeholder="Leave empty for no PIN" 
                   className="w-full p-2 border dark:border-slate-700 rounded-md text-sm mb-2 dark:bg-slate-900 dark:text-slate-200" 
                   disabled={!!linkedStudentId}
                />
                {linkedStudentId && (
                   <p className="text-[10px] text-amber-600 leading-tight">PIN is managed remotely by the school district.</p>
                )}
              </div>
            </section>

            <hr className="border-slate-100" />

            <section>
              <button onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className="flex items-center justify-between w-full text-sm font-bold uppercase text-slate-400 mb-3 hover:text-slate-600">
                <span className="flex items-center gap-2"><Key size={16} /> Advanced Settings</span>
                {showAdvancedSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showAdvancedSettings && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2 border border-transparent dark:border-slate-700">
                  <div>
                    <label className="block text-sm font-medium mb-1">Shared Secret</label>
                    <input type="password" value={config.settings.openSymbolsSecret} onChange={e => updateSetting('openSymbolsSecret', e.target.value)} placeholder="Secret" className="w-full p-2 border dark:border-slate-700 rounded-md text-sm dark:bg-slate-900 dark:text-slate-200" />
                  </div>
                  <p className="text-xs text-slate-500">Required for symbol search API.</p>
                </div>
              )}
            </section>

            <hr className="border-slate-100" />

            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Support & Feedback</h3>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-transparent dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">If Zip's offline Magic Prediction AI generates unhelpful, offensive, or severely inappropriate behavior, please report it to us immediately.</p>
                <a href="https://forms.gle/XcKp1LaxkH3DFfVF8" target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm text-center">
                    Report Inappropriate AI Suggestion
                </a>
              </div>
            </section>

            <hr className="border-slate-100" />

            <section>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Save size={16} /> Data & Storage</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExport} className="flex flex-col items-center justify-center p-4 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Download size={24} className="mb-2 text-blue-600 dark:text-blue-400" /> <span className="text-sm font-medium">Backup Full</span>
                  <span className="text-xs text-slate-400">Save everything</span>
                </button>
                <button onClick={() => handleExportPage(activePage)} className="flex flex-col items-center justify-center p-4 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Share size={24} className="mb-2 text-indigo-600 dark:text-indigo-400" /> <span className="text-sm font-medium">Export Page</span>
                  <span className="text-xs text-slate-400">Save current page</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="flex flex-col items-center justify-center p-4 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <Upload size={24} className="mb-2 text-green-600 dark:text-green-400" /> <span className="text-sm font-medium">Restore</span>
                  <span className="text-xs text-slate-400">Replace all</span>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                </label>

                <label className="flex flex-col items-center justify-center p-4 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <FilePlus size={24} className="mb-2 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium">Import Page</span>
                  <span className="text-xs text-slate-400">Add to board</span>
                  <input type="file" ref={mergeInputRef} onChange={handleMergeImport} accept=".json" className="hidden" />
                </label>
              </div>
            </section>

            <hr className="border-slate-100" />
            
            <button onClick={forceAppReload} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                <RefreshCw size={18} /> Clear App Cache
            </button>

          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-700 text-center text-xs text-slate-400 dark:text-slate-500">Zip EasySpeak v1.1 by <span className="font-bold">Zip Solutions</span></div>
        </div>
      )}
    </div>
  );
}