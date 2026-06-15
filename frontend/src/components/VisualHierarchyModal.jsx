import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Folder, MapPin, MousePointer, Grab, Search } from 'lucide-react';

// Recursive Node Component defined outside the parent to prevent compiler TDZ bugs
function TreeNode({ node, isFirst, isLast, hasSiblings, isRoot = false, type, searchQuery }) {
  const isCategory = type === 'category';
  
  // Level colors matching table hierarchy
  const levelColors = node.level === 0 
    ? 'border-[#0095E8] bg-[#F1FAFF]' 
    : node.level === 1 
    ? 'border-[#FFA800] bg-[#FFF8DD]' 
    : node.level === 2 
    ? 'border-[#50CD89] bg-[#E8FFF3]' 
    : 'border-[#F1416C] bg-[#FFF5F8]';

  const levelBadge = node.level === 0 
    ? 'bg-[#0095E8]/10 text-[#0095E8]' 
    : node.level === 1 
    ? 'bg-[#FFA800]/10 text-[#FFA800]' 
    : node.level === 2 
    ? 'bg-[#50CD89]/10 text-[#50CD89]' 
    : 'bg-[#F1416C]/10 text-[#F1416C]';

  const code = isCategory ? node.category_code : node.location_id;
  const name = isCategory ? node.category_name : node.location_name;

  // Search Matching Logic
  const isMatching = searchQuery.trim()
    ? (String(code).toLowerCase().includes(searchQuery.toLowerCase()) || 
       String(name).toLowerCase().includes(searchQuery.toLowerCase()))
    : false;
  const hasActiveSearch = searchQuery.trim().length > 0;

  const searchHighlightClass = isMatching
    ? 'border-[#0095E8] shadow-[0_0_25px_rgba(0,149,232,0.85)] scale-[1.08] animate-pulse-glow z-20'
    : hasActiveSearch
    ? 'opacity-25 scale-[0.93] saturate-50'
    : 'hover:shadow-xl hover:-translate-y-0.5';

  return (
    <div className="flex flex-col items-center relative">
      {/* Horizontal Line above siblings */}
      {hasSiblings && !isRoot && (
        <div className="absolute top-0 left-0 right-0 flex pointer-events-none">
          <div className={`w-1/2 h-0.5 ${isFirst ? 'bg-transparent' : 'bg-[#E1E3EA]'}`}></div>
          <div className={`w-1/2 h-0.5 ${isLast ? 'bg-transparent' : 'bg-[#E1E3EA]'}`}></div>
        </div>
      )}
      
      {/* Vertical Line above node to parent's horizontal connector */}
      {!isRoot && (
        <div className="w-0.5 h-6 bg-[#E1E3EA] pointer-events-none"></div>
      )}
      
      {/* Node Box */}
      <div 
        className={`flex flex-col p-4 rounded-2xl border bg-white shadow-lg transition-all duration-300 z-10 w-[200px] text-left border-t-4 cursor-default ${levelColors} ${searchHighlightClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${levelBadge}`}>
            Level {node.level}
          </span>
          {isCategory ? (
            <Folder size={12} className="text-[#A1A5B7]" />
          ) : (
            <MapPin size={12} className="text-[#A1A5B7]" />
          )}
        </div>
        
        <div className="text-[10px] font-black text-[#7E8299] uppercase tracking-wider mb-0.5 truncate" title={code}>
          {code}
        </div>
        <div className="text-xs font-bold text-[#181C32] leading-snug line-clamp-2" title={name}>
          {name}
        </div>
      </div>
      
      {/* Vertical Line below node to children */}
      {node.children && node.children.length > 0 && (
        <div className="w-0.5 h-6 bg-[#E1E3EA] pointer-events-none"></div>
      )}
      
      {/* Children Container */}
      {node.children && node.children.length > 0 && (
        <div className="flex gap-6 justify-center">
          {node.children.map((child, idx) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              isFirst={idx === 0} 
              isLast={idx === node.children.length - 1} 
              hasSiblings={node.children.length > 1}
              type={type}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const VisualHierarchyModal = ({ isOpen, onClose, data, type = 'category' }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const viewportRef = useRef(null);

  // Attach native wheel event listener with { passive: false } to prevent browser console warnings
  useEffect(() => {
    if (!isOpen) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheelEvent = (e) => {
      e.preventDefault();
      const zoomFactor = 0.08;
      setScale(prev => {
        let newScale = prev + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
        return Math.max(0.15, Math.min(3, newScale));
      });
    };

    viewport.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheelEvent);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      resetView();
      setSearchQuery('');
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  // Build Hierarchical Tree
  function buildTree(items, parentId = null) {
    let filtered = items.filter(item => {
      if (parentId === null) return !item.parent_id;
      return item.parent_id === parentId;
    });

    return filtered.map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));
  }

  // Resolve levels
  const resolveHierarchy = (items) => {
    const itemMap = {};
    items.forEach(item => {
      itemMap[item.id] = { ...item, resolvedLevel: null };
    });

    const getLevel = (id) => {
      if (!id || !itemMap[id]) return 0;
      const item = itemMap[id];
      if (item.resolvedLevel !== null) return item.resolvedLevel;
      
      if (!item.parent_id) {
        item.resolvedLevel = 0;
      } else {
        item.resolvedLevel = getLevel(item.parent_id) + 1;
      }
      return item.resolvedLevel;
    };

    return items.map(item => ({
      ...item,
      level: getLevel(item.id)
    }));
  };

  const resolvedData = resolveHierarchy(data);
  const treeNodes = buildTree(resolvedData);

  // Match counter
  const getMatchCount = () => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase();
    return resolvedData.filter(item => {
      const code = type === 'category' ? item.category_code : item.location_id;
      const name = type === 'category' ? item.category_name : item.location_name;
      return String(code).toLowerCase().includes(q) || String(name).toLowerCase().includes(q);
    }).length;
  };

  // Pan and Zoom Event Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.15));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.15, prev - 0.15));
  };

  const resetView = () => {
    setScale(0.85); // slightly zoomed out initially to fit better
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col z-[200] animate-fade-in select-none">
      
      {/* Styles for Pulse Glow Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(0, 149, 232, 0.45);
            border-color: #0095E8;
            transform: scale(1.04);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 149, 232, 0.95);
            border-color: #0084CC;
            transform: scale(1.09);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 1.8s infinite ease-in-out !important;
        }
      `}} />

      {/* Header Bar */}
      <div className="h-16 px-8 bg-white border-b border-[#F1F1F4] flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F1FAFF] rounded-xl flex items-center justify-center text-[#0095E8]">
            {type === 'category' ? <Folder size={20} /> : <MapPin size={20} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#181C32]">
              Visualisasi Hirarki {type === 'category' ? 'Kategori Aset' : 'Lokasi'}
            </h3>
            <p className="text-xs text-[#A1A5B7] font-light">
              Tarik kanvas untuk menggeser (Pan) dan gunakan scroll untuk memperbesar/memperkecil (Zoom).
            </p>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-80 mx-6">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
          <input 
            type="text"
            placeholder={`Cari nama/kode ${type === 'category' ? 'kategori' : 'lokasi'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-14 py-2 bg-[#F9F9F9] border border-[#E1E3EA] focus:border-[#0095E8]/40 rounded-xl text-xs outline-none focus:bg-white transition-all font-medium shadow-inner"
          />
          {searchQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="text-[9px] font-extrabold text-[#7E8299] bg-gray-200/60 px-1.5 py-0.5 rounded">
                {getMatchCount()}
              </span>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[#A1A5B7] hover:text-[#7E8299] p-0.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Controls */}
          <div className="flex items-center bg-[#F9F9F9] border border-[#E1E3EA] rounded-xl p-1 gap-1 mr-4 shadow-inner">
            <button 
              onClick={zoomIn} 
              className="p-2 text-[#7E8299] hover:bg-white hover:text-[#0095E8] hover:shadow-sm rounded-lg transition-all"
              title="Perbesar"
            >
              <ZoomIn size={16} />
            </button>
            <button 
              onClick={zoomOut} 
              className="p-2 text-[#7E8299] hover:bg-white hover:text-[#0095E8] hover:shadow-sm rounded-lg transition-all"
              title="Perkecil"
            >
              <ZoomOut size={16} />
            </button>
            <button 
              onClick={resetView} 
              className="p-2 text-[#7E8299] hover:bg-white hover:text-[#0095E8] hover:shadow-sm rounded-lg transition-all"
              title="Reset Tampilan"
            >
              <RotateCcw size={16} />
            </button>
            <div className="h-4 w-px bg-[#E1E3EA] mx-1"></div>
            <span className="text-[10px] font-bold text-[#5E6278] px-2 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <button 
            onClick={onClose} 
            className="p-2.5 text-[#A1A5B7] hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Infinite Canvas Viewport */}
      <div 
        ref={viewportRef}
        className={`flex-1 relative overflow-hidden bg-[#F5F8FA] cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Figma Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]" 
          style={{
            backgroundImage: 'radial-gradient(#181C32 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Translation and Scale Container */}
        <div 
          className="absolute inset-0 flex items-start justify-center pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center 100px', // Center zoom point slightly down from top
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* Tree Wrapper */}
          <div className="pointer-events-auto p-[100px] pt-[60px] flex gap-12 justify-center">
            {treeNodes.length > 0 ? (
              treeNodes.map((root, idx) => (
                <TreeNode 
                  key={root.id} 
                  node={root} 
                  isFirst={idx === 0} 
                  isLast={idx === treeNodes.length - 1} 
                  hasSiblings={treeNodes.length > 1}
                  isRoot={true}
                  type={type}
                  searchQuery={searchQuery}
                />
              ))
            ) : (
              <div className="bg-white border border-[#E1E3EA] rounded-2xl p-8 shadow-md text-center max-w-sm">
                <p className="text-sm text-[#7E8299] font-medium">Belum ada data struktur hirarki.</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Figma-like Navigation Helper */}
        <div className="absolute bottom-6 left-6 bg-white/85 backdrop-blur-sm border border-[#E1E3EA] px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 pointer-events-none text-[10px] font-bold text-[#7E8299] uppercase tracking-wider">
          <Grab size={12} className="text-[#0095E8]" />
          <span>Tarik Layar</span>
          <span className="w-1 h-1 bg-[#E1E3EA] rounded-full"></span>
          <MousePointer size={12} className="text-[#0095E8]" />
          <span>Scroll untuk Zoom</span>
        </div>
      </div>

    </div>
  );
};

export default VisualHierarchyModal;
