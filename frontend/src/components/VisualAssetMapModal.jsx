import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Box, MapPin, Folder, Users, Search, HelpCircle, User, Award, Tag, ArrowRight, Route } from 'lucide-react';

// Condition Badge & Border styling helpers (pure functions defined at module scope)
const getConditionStyle = (condId) => {
  const id = Number(condId);
  if (id === 1) return { label: 'Baik', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200/50', border: 'border-l-emerald-500' };
  if (id === 2) return { label: 'Rusak Ringan', badge: 'bg-amber-50 text-amber-600 border-amber-200/50', border: 'border-l-amber-500' };
  if (id === 3) return { label: 'Rusak Berat', badge: 'bg-rose-50 text-rose-600 border-rose-200/50', border: 'border-l-rose-500' };
  return { label: 'Unknown', badge: 'bg-slate-50 text-slate-600 border-slate-200/50', border: 'border-l-slate-400' };
};

// Recursive Node Component
function TreeNode({ 
  node, 
  isFirst, 
  isLast, 
  hasSiblings, 
  isRoot = false, 
  searchQuery, 
  activeView, 
  locations,
  selectedPathIds,
  selectedNodeId,
  setSelectedNodeId
}) {
  const q = searchQuery.toLowerCase().trim();
  
  // Check if matching search query
  const isMatchingSearch = q
    ? (node.isAsset
        ? (node.asset_name?.toLowerCase().includes(q) ||
           node.register_no?.toLowerCase().includes(q) ||
           node.rfid_tag?.toLowerCase().includes(q) ||
           node.asset_user?.toLowerCase().includes(q))
        : (node.name?.toLowerCase().includes(q) ||
           node.code?.toLowerCase().includes(q)))
    : false;

  const hasActiveSearch = q.length > 0;
  const hasActiveSelection = selectedNodeId !== null;
  const isOnPath = selectedPathIds.has(node.id);
  const isTarget = node.id === selectedNodeId;

  // Compute styling priority: Target -> On Path -> Matching Search -> Dimmed/Normal
  let cardHighlightClass = 'hover:shadow-xl hover:-translate-y-0.5';
  
  if (isTarget) {
    cardHighlightClass = 'border-[#0095E8] shadow-[0_0_30px_rgba(0,149,232,0.85)] scale-[1.08] animate-pulse-glow z-30';
  } else if (isOnPath) {
    cardHighlightClass = 'border-[#0095E8] bg-sky-50/50 shadow-[0_0_15px_rgba(0,149,232,0.35)] scale-[1.03] z-20';
  } else if (isMatchingSearch) {
    cardHighlightClass = 'border-[#0095E8] shadow-[0_0_20px_rgba(0,149,232,0.6)] scale-[1.06] z-20';
  } else if (hasActiveSelection || hasActiveSearch) {
    cardHighlightClass = 'opacity-30 scale-[0.94] saturate-50 hover:opacity-80 transition-all duration-300';
  }

  // Handle click on node to select/deselect
  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (isTarget) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(node.id);
    }
  };

  // Different Styling for Category/Location vs Actual Product Node
  if (node.isAsset) {
    const cond = getConditionStyle(node.condition_id);
    return (
      <div className="flex flex-col items-center relative">
        {hasSiblings && (
          <div className="absolute top-0 left-0 right-0 flex pointer-events-none">
            <div className={`w-1/2 h-0.5 transition-all duration-300 ${isFirst ? 'bg-transparent' : isOnPath ? 'bg-[#0095E8]' : 'bg-[#E1E3EA]'}`}></div>
            <div className={`w-1/2 h-0.5 transition-all duration-300 ${isLast ? 'bg-transparent' : isOnPath ? 'bg-[#0095E8]' : 'bg-[#E1E3EA]'}`}></div>
          </div>
        )}
        <div className={`w-0.5 h-6 transition-all duration-300 ${isOnPath ? 'bg-[#0095E8] shadow-[0_0_8px_rgba(0,149,232,0.5)]' : 'bg-[#E1E3EA]'} pointer-events-none`}></div>

        {/* Registered Asset Leaf Card */}
        <div 
          className={`flex flex-col p-4.5 rounded-2xl border border-t-1 border-r-1 border-b-1 border-[#EFF2F5] bg-white shadow-md transition-all duration-300 cursor-pointer w-[240px] text-left border-l-4 ${cond.border} ${cardHighlightClass}`}
          onClick={handleNodeClick}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-extrabold text-[#7E8299] bg-[#F5F8FA] px-2 py-0.5 rounded-lg border border-[#E1E3EA]/60 uppercase tracking-wider">
              {node.asset_id_code}
            </span>
            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-wider ${cond.badge}`}>
              {cond.label}
            </span>
          </div>

          <div className="text-xs font-black text-[#181C32] leading-snug line-clamp-2 mb-2" title={node.asset_name}>
            {node.asset_name}
          </div>

          <div className="space-y-1 border-t border-[#F1F1F4]/80 pt-2 text-[10px] text-[#5E6278] font-semibold">
            {node.register_no && (
              <div className="flex items-center gap-1.5">
                <Award size={10} className="text-[#A1A5B7]" />
                <span>Reg: <strong className="text-[#3F4254]">{node.register_no}</strong></span>
              </div>
            )}
            {node.rfid_tag && (
              <div className="flex items-center gap-1.5">
                <Tag size={10} className="text-[#A1A5B7]" />
                <span>RFID: <strong className="text-[#3F4254] font-black">{node.rfid_tag}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <User size={10} className="text-[#A1A5B7]" />
              <span>PIC: <strong className="text-[#0095E8]">{node.asset_user || 'Belum Ada'}</strong></span>
            </div>
            {node.location_name && (
              <div className="flex items-center gap-1.5">
                <MapPin size={10} className="text-[#A1A5B7]" />
                <span className="truncate">Loc: <strong className="text-[#5E6278]">{node.location_name}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal Organization/Location/Category node
  const levelColors = node.level === 0 
    ? (isOnPath ? 'border-[#0095E8] bg-[#F1FAFF]' : 'border-[#0095E8] bg-[#F1FAFF]') 
    : node.level === 1 
    ? (isOnPath ? 'border-[#0095E8] bg-[#FFF8DD]' : 'border-[#FFA800] bg-[#FFF8DD]') 
    : node.level === 2 
    ? (isOnPath ? 'border-[#0095E8] bg-[#E8FFF3]' : 'border-[#50CD89] bg-[#E8FFF3]') 
    : (isOnPath ? 'border-[#0095E8] bg-[#FFF5F8]' : 'border-[#F1416C] bg-[#FFF5F8]');

  const levelBadge = node.level === 0 
    ? 'bg-[#0095E8]/10 text-[#0095E8]' 
    : node.level === 1 
    ? 'bg-[#FFA800]/10 text-[#FFA800]' 
    : node.level === 2 
    ? 'bg-[#50CD89]/10 text-[#50CD89]' 
    : 'bg-[#F1416C]/10 text-[#F1416C]';

  // Check if any of children is on path
  const isAnyChildOnPath = node.children && node.children.some(c => selectedPathIds.has(c.id));

  return (
    <div className="flex flex-col items-center relative">
      {hasSiblings && !isRoot && (
        <div className="absolute top-0 left-0 right-0 flex pointer-events-none">
          <div className={`w-1/2 h-0.5 transition-all duration-300 ${isFirst ? 'bg-transparent' : isOnPath ? 'bg-[#0095E8]' : 'bg-[#E1E3EA]'}`}></div>
          <div className={`w-1/2 h-0.5 transition-all duration-300 ${isLast ? 'bg-transparent' : isOnPath ? 'bg-[#0095E8]' : 'bg-[#E1E3EA]'}`}></div>
        </div>
      )}
      
      {!isRoot && (
        <div className={`w-0.5 h-6 transition-all duration-300 ${isOnPath ? 'bg-[#0095E8] shadow-[0_0_8px_rgba(0,149,232,0.5)]' : 'bg-[#E1E3EA]'} pointer-events-none`}></div>
      )}
      
      {/* Node Box */}
      <div 
        className={`flex flex-col p-4 rounded-2xl border bg-white shadow-lg transition-all duration-300 z-10 w-[200px] text-left border-t-4 cursor-pointer ${levelColors} ${cardHighlightClass}`}
        onClick={handleNodeClick}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${levelBadge}`}>
            {isRoot ? 'ORGANISASI' : `Level ${node.level}`}
          </span>
          {activeView === 'location' ? (
            <MapPin size={12} className="text-[#A1A5B7]" />
          ) : activeView === 'category' ? (
            <Folder size={12} className="text-[#A1A5B7]" />
          ) : (
            <Users size={12} className="text-[#A1A5B7]" />
          )}
        </div>
        
        <div className="text-[10px] font-black text-[#7E8299] uppercase tracking-wider mb-0.5 truncate">
          {node.code}
        </div>
        <div className="text-xs font-bold text-[#181C32] leading-snug line-clamp-2">
          {node.name}
        </div>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className={`w-0.5 h-6 transition-all duration-300 ${isOnPath && isAnyChildOnPath ? 'bg-[#0095E8] shadow-[0_0_8px_rgba(0,149,232,0.5)]' : 'bg-[#E1E3EA]'} pointer-events-none`}></div>
      )}
      
      {node.children && node.children.length > 0 && (
        <div className="flex gap-6 justify-center">
          {node.children.map((child, idx) => (
            <TreeNode 
              key={child.id || child.code} 
              node={child} 
              isFirst={idx === 0} 
              isLast={idx === node.children.length - 1} 
              hasSiblings={node.children.length > 1}
              searchQuery={searchQuery}
              activeView={activeView}
              locations={locations}
              selectedPathIds={selectedPathIds}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const VisualAssetMapModal = ({ isOpen, onClose, assets = [], categories = [], locations = [], departments = [] }) => {
  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('audit-flow'); // Default to the combined 'audit-flow'
  const [hoveredFlowId, setHoveredFlowId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null); // Click-to-highlight state for the tree paths
  const [visibleCount, setVisibleCount] = useState(50); // Limit rendered DOM nodes to 50 at a time for performance
  const viewportRef = useRef(null);

  // Attach native wheel event listener with { passive: false } to avoid console warnings
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
      setSelectedNodeId(null);
      setVisibleCount(50); // Reset limit on view change
    }
  }, [isOpen, activeView]);

  useEffect(() => {
    setVisibleCount(50); // Reset limit on search query change
  }, [searchQuery]);

  if (!isOpen) return null;

  // Resolve hierarchy for locations & categories to calculate depth level
  const resolveHierarchy = (items, type) => {
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

  const resolvedLocations = resolveHierarchy(locations, 'location');
  const resolvedCategories = resolveHierarchy(categories, 'category');

  // Compute selected path nodes to highlight active branches in the tree views
  const getSelectedPathIds = () => {
    const pathIds = new Set();
    if (!selectedNodeId) return pathIds;

    pathIds.add(selectedNodeId);

    const selectedNodeStr = String(selectedNodeId);
    // If target is an asset node (e.g. 'asset-34')
    if (selectedNodeStr.startsWith('asset-')) {
      const assetDbId = Number(selectedNodeStr.replace('asset-', ''));
      const asset = assets.find(a => Number(a.id) === assetDbId);
      if (asset) {
        if (activeView === 'location') {
          let currentLocId = asset.location_id;
          while (currentLocId) {
            pathIds.add(currentLocId);
            const loc = locations.find(l => String(l.id) === String(currentLocId));
            currentLocId = loc ? loc.parent_id : null;
          }
          pathIds.add('root-company');
        } else if (activeView === 'category') {
          let currentCatId = asset.category_id;
          while (currentCatId) {
            pathIds.add(currentCatId);
            const cat = categories.find(c => String(c.id) === String(currentCatId));
            currentCatId = cat ? cat.parent_id : null;
          }
          pathIds.add('root-company');
        } else if (activeView === 'department') {
          if (asset.department_id) {
            pathIds.add(`dept-${asset.department_id}`);
          }
          pathIds.add('root-company');
        }
      }
    } else {
      // If target is a branch node (location, category, or department)
      if (activeView === 'location') {
        let currentLocId = selectedNodeId;
        while (currentLocId) {
          pathIds.add(currentLocId);
          const loc = locations.find(l => String(l.id) === String(currentLocId));
          currentLocId = loc ? loc.parent_id : null;
        }
        pathIds.add('root-company');
      } else if (activeView === 'category') {
        let currentCatId = selectedNodeId;
        while (currentCatId) {
          pathIds.add(currentCatId);
          const cat = categories.find(c => String(c.id) === String(currentCatId));
          currentCatId = cat ? cat.parent_id : null;
        }
        pathIds.add('root-company');
      } else if (activeView === 'department') {
        pathIds.add(selectedNodeId);
        pathIds.add('root-company');
      }
    }

    return pathIds;
  };

  const selectedPathIds = getSelectedPathIds();

  // 1. Build Location Tree with Assets
  function buildLocationTree(locs, parentId = null) {
    const filtered = locs.filter(loc => {
      if (parentId === null) return !loc.parent_id;
      return loc.parent_id === parentId;
    });

    return filtered.map(loc => {
      const locAssets = assets.filter(a => String(a.location_id) === String(loc.id));
      const assetChildren = locAssets.map(asset => ({
        id: `asset-${asset.id}`,
        isAsset: true,
        asset_name: asset.asset_name,
        register_no: asset.register_no,
        rfid_tag: asset.rfid_tag,
        asset_user: asset.asset_user,
        condition_id: asset.condition_id,
        brand: asset.brand,
        model_tipe: asset.model_tipe,
        asset_id_code: asset.asset_id,
        level: 99,
        children: []
      }));

      return {
        ...loc,
        isAsset: false,
        name: loc.location_name,
        code: loc.location_id,
        children: [
          ...buildLocationTree(locs, loc.id),
          ...assetChildren
        ]
      };
    });
  }

  // 2. Build Category Tree with Assets
  function buildCategoryTree(cats, parentId = null) {
    const filtered = cats.filter(cat => {
      if (parentId === null) return !cat.parent_id;
      return cat.parent_id === parentId;
    });

    return filtered.map(cat => {
      const catAssets = assets.filter(a => String(a.category_id) === String(cat.id));
      const assetChildren = catAssets.map(asset => {
        const loc = locations.find(l => String(l.id) === String(asset.location_id));
        return {
          id: `asset-${asset.id}`,
          isAsset: true,
          asset_name: asset.asset_name,
          register_no: asset.register_no,
          rfid_tag: asset.rfid_tag,
          asset_user: asset.asset_user,
          condition_id: asset.condition_id,
          brand: asset.brand,
          model_tipe: asset.model_tipe,
          asset_id_code: asset.asset_id,
          location_name: loc ? loc.location_name : null,
          level: 99,
          children: []
        };
      });

      return {
        ...cat,
        isAsset: false,
        name: cat.category_name,
        code: cat.category_code,
        children: [
          ...buildCategoryTree(cats, cat.id),
          ...assetChildren
        ]
      };
    });
  }

  // 3. Build Department Tree with Assets
  const buildDepartmentTree = () => {
    return departments.map(dept => {
      const deptAssets = assets.filter(a => String(a.department_id) === String(dept.id));
      const assetChildren = deptAssets.map(asset => {
        const loc = locations.find(l => String(l.id) === String(asset.location_id));
        return {
          id: `asset-${asset.id}`,
          isAsset: true,
          asset_name: asset.asset_name,
          register_no: asset.register_no,
          rfid_tag: asset.rfid_tag,
          asset_user: asset.asset_user,
          condition_id: asset.condition_id,
          brand: asset.brand,
          model_tipe: asset.model_tipe,
          asset_id_code: asset.asset_id,
          location_name: loc ? loc.location_name : null,
          level: 99,
          children: []
        };
      });

      return {
        id: `dept-${dept.id}`,
        isAsset: false,
        name: dept.name,
        code: `DEPT-${dept.id}`,
        level: 1,
        children: assetChildren
      };
    });
  };

  // 4. Combined Audit Trail Flow Logic
  const getAuditFlows = () => {
    const q = searchQuery.toLowerCase().trim();
    
    const filtered = assets.filter(asset => {
      if (!q) return true;
      const cat = categories.find(c => String(c.id) === String(asset.category_id));
      const dept = departments.find(d => String(d.id) === String(asset.department_id));
      const loc = locations.find(l => String(l.id) === String(asset.location_id));
      
      return (
        asset.asset_name?.toLowerCase().includes(q) ||
        asset.asset_id?.toLowerCase().includes(q) ||
        asset.register_no?.toLowerCase().includes(q) ||
        asset.rfid_tag?.toLowerCase().includes(q) ||
        asset.asset_user?.toLowerCase().includes(q) ||
        (cat && (cat.category_name?.toLowerCase().includes(q) || cat.category_code?.toLowerCase().includes(q))) ||
        (dept && dept.name?.toLowerCase().includes(q)) ||
        (loc && (loc.location_name?.toLowerCase().includes(q) || loc.location_id?.toLowerCase().includes(q)))
      );
    });

    return filtered.map(asset => {
      const cat = categories.find(c => String(c.id) === String(asset.category_id));
      const dept = departments.find(d => String(d.id) === String(asset.department_id));
      const loc = locations.find(l => String(l.id) === String(asset.location_id));

      return {
        id: asset.id,
        asset_id_code: asset.asset_id,
        asset_name: asset.asset_name,
        register_no: asset.register_no,
        rfid_tag: asset.rfid_tag,
        asset_user: asset.asset_user,
        condition_id: asset.condition_id,
        brand: asset.brand,
        model_tipe: asset.model_tipe,
        category: cat ? { code: cat.category_code, name: cat.category_name } : null,
        department: dept ? { name: dept.name } : null,
        location: loc ? { id: loc.location_id, name: loc.location_name } : null
      };
    });
  };

  const auditFlows = getAuditFlows();

  // Virtual Root Node for Traditional Tree Views
  const rootNode = activeView !== 'audit-flow' ? {
    id: 'root-company',
    name: activeView === 'location' ? 'PAMFLOW LOKASI' : activeView === 'category' ? 'PAMFLOW KATEGORI' : 'PAMFLOW DEPARTEMEN',
    code: 'PAMFLOW',
    isAsset: false,
    level: 0,
    children: activeView === 'location' 
      ? buildLocationTree(resolvedLocations)
      : activeView === 'category'
      ? buildCategoryTree(resolvedCategories)
      : buildDepartmentTree()
  } : null;

  // Search filter node count
  function countMatches(node) {
    let count = 0;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return 0;

    const isMatch = node.isAsset
      ? (node.asset_name?.toLowerCase().includes(q) ||
         node.register_no?.toLowerCase().includes(q) ||
         node.rfid_tag?.toLowerCase().includes(q) ||
         node.asset_user?.toLowerCase().includes(q))
      : (node.name?.toLowerCase().includes(q) ||
         node.code?.toLowerCase().includes(q));

    if (isMatch) count++;

    if (node.children) {
      node.children.forEach(child => {
        count += countMatches(child);
      });
    }
    return count;
  }

  const totalMatches = activeView === 'audit-flow' ? auditFlows.length : countMatches(rootNode);

  // Drag and Drop canvas handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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

  // Click on canvas background to clear active highlighted path
  const handleCanvasClick = (e) => {
    if (e.target.classList.contains('canvas-bg')) {
      setSelectedNodeId(null);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.15));
  const zoomOut = () => setScale(prev => Math.max(0.15, prev - 0.15));
  const resetView = () => {
    if (activeView === 'audit-flow') {
      setScale(0.85);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(0.8);
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col z-[290] animate-fade-in select-none">
      
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
        @keyframes progress-dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash {
          stroke-dasharray: 6, 4;
          animation: progress-dash 0.8s linear infinite;
        }
      `}} />

      {/* Header Bar */}
      <div className="h-20 px-8 bg-white border-b border-[#F1F1F4] flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#F1FAFF] rounded-xl flex items-center justify-center text-[#0095E8]">
            <Route size={22} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#181C32] flex items-center gap-2">
              Peta Relasi & Penelusuran Aset
            </h3>
            <p className="text-xs text-[#A1A5B7] font-semibold mt-0.5">
              Visualisasi terintegrasi untuk melacak letak, penanggung jawab, kategori, dan RFID secara spasial.
            </p>
          </div>
        </div>

        {/* View Segmented Toggle Controls */}
        <div className="flex items-center bg-[#F9F9F9] border border-[#E1E3EA] rounded-2xl p-1 gap-1 shadow-inner mx-4">
          <button 
            onClick={() => setActiveView('audit-flow')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeView === 'audit-flow' ? 'bg-[#1B3E84] text-white shadow-sm' : 'text-[#7E8299] hover:bg-white hover:text-[#3F4254]'}`}
          >
            <Route size={13} />
            Alur Penelusuran Audit (Combined)
          </button>
          <button 
            onClick={() => setActiveView('location')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeView === 'location' ? 'bg-[#1B3E84] text-white shadow-sm' : 'text-[#7E8299] hover:bg-white hover:text-[#3F4254]'}`}
          >
            <MapPin size={13} />
            Berdasar Lokasi
          </button>
          <button 
            onClick={() => setActiveView('category')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeView === 'category' ? 'bg-[#1B3E84] text-white shadow-sm' : 'text-[#7E8299] hover:bg-white hover:text-[#3F4254]'}`}
          >
            <Folder size={13} />
            Berdasar Kategori
          </button>
          <button 
            onClick={() => setActiveView('department')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeView === 'department' ? 'bg-[#1B3E84] text-white shadow-sm' : 'text-[#7E8299] hover:bg-white hover:text-[#3F4254]'}`}
          >
            <Users size={13} />
            Berdasar Departemen
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
          <input 
            type="text"
            placeholder="Cari No. Reg/RFID/Nama/PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-2 bg-[#F9F9F9] border border-[#E1E3EA] focus:border-[#0095E8]/40 rounded-xl text-xs outline-none focus:bg-white transition-all font-bold shadow-inner"
          />
          {searchQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="text-[9px] font-extrabold text-[#7E8299] bg-gray-200/60 px-1.5 py-0.5 rounded">
                {totalMatches}
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

        {/* Zoom & Close Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#F9F9F9] border border-[#E1E3EA] rounded-xl p-1 gap-1 shadow-inner">
            <button onClick={zoomIn} className="p-2 text-[#7E8299] hover:bg-white hover:text-[#0095E8] rounded-lg transition-all" title="Zoom In"><ZoomIn size={16} /></button>
            <button onClick={zoomOut} className="p-2 text-[#7E8299] hover:bg-white hover:text-[#0095E8] rounded-lg transition-all" title="Zoom Out"><ZoomOut size={16} /></button>
            <button onClick={resetView} className="p-2 text-[#7E8299] hover:bg-white hover:text-[#0095E8] rounded-lg transition-all" title="Reset View"><RotateCcw size={16} /></button>
            <span className="text-[10px] font-bold text-[#5E6278] px-2 w-12 text-center">{Math.round(scale * 100)}%</span>
          </div>

          <button onClick={onClose} className="p-3 text-[#A1A5B7] hover:bg-gray-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Infinite Canvas */}
      <div 
        ref={viewportRef}
        className={`flex-1 relative overflow-hidden bg-[#F5F8FA] canvas-bg cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Pattern Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.035] canvas-bg" 
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
            transformOrigin: activeView === 'audit-flow' ? 'center 50px' : 'center 100px',
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* Canvas Wrapper */}
          <div className="pointer-events-auto p-[100px] pt-[60px] flex flex-col items-center justify-center">
            
            {activeView === 'audit-flow' ? (
              // ------------------- AUDIT JOURNEY FLOW VIEW -------------------
              <div className="flex flex-col gap-10 items-start w-max">
                
                {/* Flow Header Legend */}
                <div className="flex items-center gap-[64px] pb-4 border-b border-[#E1E3EA] w-full text-[11px] font-extrabold text-[#7E8299] uppercase tracking-widest pl-2">
                  <div className="w-[220px]">1. Jenis Aset (Kategori)</div>
                  <div className="w-[64px]"></div> {/* Connector space */}
                  <div className="w-[220px]">2. Departemen (PIC)</div>
                  <div className="w-[64px]"></div> {/* Connector space */}
                  <div className="w-[220px]">3. Lokasi Fisik</div>
                  <div className="w-[64px]"></div> {/* Connector space */}
                  <div className="w-[250px]">4. Detail Aset (Audit Trail)</div>
                </div>

                {auditFlows.length > 0 ? (
                  <>
                    {auditFlows.slice(0, visibleCount).map((flow) => {
                      const isFlowSelected = selectedNodeId === `asset-${flow.id}`;
                      const isFlowHovered = hoveredFlowId === flow.id || isFlowSelected;
                      const cond = getConditionStyle(flow.condition_id);

                      return (
                        <div 
                          key={flow.id} 
                          className={`flex items-center gap-0 p-3.5 rounded-3xl transition-all duration-300 cursor-pointer ${isFlowSelected ? 'bg-[#0095E8]/10 shadow-[inset_0_0_15px_rgba(0,149,232,0.25)] border border-[#0095E8]/30' : isFlowHovered ? 'bg-[#1b3e84]/5 shadow-inner' : 'bg-transparent'}`}
                          onMouseEnter={() => setHoveredFlowId(flow.id)}
                          onMouseLeave={() => setHoveredFlowId(null)}
                          onClick={() => setSelectedNodeId(isFlowSelected ? null : `asset-${flow.id}`)}
                        >
                          {/* STEP 1: CATEGORY */}
                          <div className={`flex flex-col p-4 rounded-2xl border bg-white shadow-md w-[220px] text-left transition-all duration-300 ${isFlowHovered ? 'border-[#0095E8] shadow-lg -translate-y-0.5' : 'border-[#EFF2F5]'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-sky-50 text-[#0095E8] border border-sky-100">Kategori</span>
                              <Folder size={12} className="text-[#0095E8]" />
                            </div>
                            <div className="text-[10px] font-extrabold text-[#7E8299] uppercase tracking-wider mb-0.5 truncate">{flow.category?.code || 'UMUM'}</div>
                            <div className="text-xs font-black text-[#181C32] truncate">{flow.category?.name || 'Tanpa Kategori'}</div>
                          </div>

                          {/* CONNECTOR 1 */}
                          <div className="w-[64px] flex items-center justify-center pointer-events-none">
                            <svg className="w-16 h-6 overflow-visible" viewBox="0 0 64 24">
                              <path 
                                d="M 0 12 L 64 12" 
                                fill="none" 
                                stroke={isFlowHovered ? '#0095E8' : '#D1D5DB'} 
                                strokeWidth="2.5" 
                                className={isFlowHovered ? 'animate-dash' : ''} 
                              />
                              <polygon 
                                points="58,7 64,12 58,17" 
                                fill={isFlowHovered ? '#0095E8' : '#D1D5DB'} 
                              />
                            </svg>
                          </div>

                          {/* STEP 2: DEPARTMENT / PIC */}
                          <div className={`flex flex-col p-4 rounded-2xl border bg-white shadow-md w-[220px] text-left transition-all duration-300 ${isFlowHovered ? 'border-[#FFA800] shadow-lg -translate-y-0.5' : 'border-[#EFF2F5]'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-50 text-[#FFA800] border border-amber-100">Divisi</span>
                              <Users size={12} className="text-[#FFA800]" />
                            </div>
                            <div className="text-[10px] font-extrabold text-[#7E8299] uppercase tracking-wider mb-0.5 truncate">PIC: {flow.asset_user || 'Belum Ada'}</div>
                            <div className="text-xs font-black text-[#181C32] truncate">{flow.department?.name || 'Tanpa Departemen'}</div>
                          </div>

                          {/* CONNECTOR 2 */}
                          <div className="w-[64px] flex items-center justify-center pointer-events-none">
                            <svg className="w-16 h-6 overflow-visible" viewBox="0 0 64 24">
                              <path 
                                d="M 0 12 L 64 12" 
                                fill="none" 
                                stroke={isFlowHovered ? '#FFA800' : '#D1D5DB'} 
                                strokeWidth="2.5" 
                                className={isFlowHovered ? 'animate-dash' : ''} 
                              />
                              <polygon 
                                points="58,7 64,12 58,17" 
                                fill={isFlowHovered ? '#FFA800' : '#D1D5DB'} 
                              />
                            </svg>
                          </div>

                          {/* STEP 3: PHYSICAL LOCATION */}
                          <div className={`flex flex-col p-4 rounded-2xl border bg-white shadow-md w-[220px] text-left transition-all duration-300 ${isFlowHovered ? 'border-[#50CD89] shadow-lg -translate-y-0.5' : 'border-[#EFF2F5]'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-50 text-[#50CD89] border border-emerald-100">Posisi</span>
                              <MapPin size={12} className="text-[#50CD89]" />
                            </div>
                            <div className="text-[10px] font-extrabold text-[#7E8299] uppercase tracking-wider mb-0.5 truncate">{flow.location?.id || 'GUDANG'}</div>
                            <div className="text-xs font-black text-[#181C32] truncate">{flow.location?.name || 'Tanpa Lokasi'}</div>
                          </div>

                          {/* CONNECTOR 3 */}
                          <div className="w-[64px] flex items-center justify-center pointer-events-none">
                            <svg className="w-16 h-6 overflow-visible" viewBox="0 0 64 24">
                              <path 
                                d="M 0 12 L 64 12" 
                                fill="none" 
                                stroke={isFlowHovered ? '#50CD89' : '#D1D5DB'} 
                                strokeWidth="2.5" 
                                className={isFlowHovered ? 'animate-dash' : ''} 
                              />
                              <polygon 
                                points="58,7 64,12 58,17" 
                                fill={isFlowHovered ? '#50CD89' : '#D1D5DB'} 
                              />
                            </svg>
                          </div>

                          {/* STEP 4: DETAILED PHYSICAL ASSET */}
                          <div 
                            className={`flex flex-col p-4 rounded-2xl border border-l-4 bg-white shadow-md w-[250px] text-left transition-all duration-300 ${cond.border} ${isFlowHovered ? 'shadow-[0_0_25px_rgba(0,149,232,0.55)] scale-[1.04] border-r-[#0095E8]/40 border-t-[#0095E8]/20 border-b-[#0095E8]/20 animate-pulse-glow z-10' : 'border-[#EFF2F5]'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black text-[#7E8299] bg-[#F5F8FA] px-2 py-0.5 rounded border border-[#E1E3EA] uppercase tracking-wider">
                                {flow.asset_id_code}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${cond.badge}`}>
                                {cond.label}
                              </span>
                            </div>

                            <div className="text-xs font-black text-[#181C32] leading-snug line-clamp-2 mb-2" title={flow.asset_name}>
                              {flow.asset_name}
                            </div>

                            <div className="space-y-1 border-t border-[#F1F1F4]/80 pt-2 text-[10px] text-[#5E6278] font-bold">
                              {flow.register_no && (
                                <div className="flex items-center gap-1.5">
                                  <Award size={10} className="text-[#A1A5B7]" />
                                  <span>Reg: <strong className="text-[#3F4254]">{flow.register_no}</strong></span>
                                </div>
                              )}
                              {flow.rfid_tag && (
                                <div className="flex items-center gap-1.5">
                                  <Tag size={10} className="text-[#A1A5B7]" />
                                  <span>RFID: <strong className="text-[#0095E8]">{flow.rfid_tag}</strong></span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <User size={10} className="text-[#A1A5B7]" />
                                <span>PIC: <strong className="text-[#5E6278]">{flow.asset_user || 'Belum Ada'}</strong></span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                    {auditFlows.length > visibleCount && (
                      <div className="flex justify-center w-full pt-6 pb-12 pointer-events-auto">
                        <button 
                          onClick={() => setVisibleCount(prev => prev + 50)}
                          className="flex items-center gap-2 px-6 py-3 bg-[#1B3E84] hover:bg-[#153066] text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
                        >
                          <Route size={14} />
                          Tampilkan 50 Aset Lagi ({auditFlows.length - visibleCount} Tersisa)
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white border border-[#E1E3EA] rounded-2xl p-10 shadow-md text-center w-[960px]">
                    <HelpCircle className="mx-auto text-[#A1A5B7] mb-3" size={36} />
                    <p className="text-sm text-[#7E8299] font-bold">Tidak ada aset yang cocok dengan filter pencarian Anda.</p>
                    <p className="text-xs text-[#A1A5B7] font-semibold mt-1">Coba ketik kata kunci pencarian yang lain.</p>
                  </div>
                )}
              </div>
            ) : (
              // ------------------- TRADITIONAL HIERARCHY TREE VIEWS -------------------
              rootNode ? (
                <TreeNode 
                  node={rootNode} 
                  isFirst={true} 
                  isLast={true} 
                  hasSiblings={false}
                  isRoot={true}
                  searchQuery={searchQuery}
                  activeView={activeView}
                  locations={locations}
                  selectedPathIds={selectedPathIds}
                  selectedNodeId={selectedNodeId}
                  setSelectedNodeId={setSelectedNodeId}
                />
              ) : (
                <div className="bg-white border border-[#E1E3EA] rounded-2xl p-8 shadow-md text-center max-w-sm">
                  <p className="text-sm text-[#7E8299] font-medium">Belum ada data struktur relasi aset.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Floating Figma-like Navigation Helper */}
        <div className="absolute bottom-6 left-6 bg-white/85 backdrop-blur-sm border border-[#E1E3EA] px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 pointer-events-none text-[10px] font-bold text-[#7E8299] uppercase tracking-wider">
          <Box size={12} className="text-[#0095E8]" />
          <span>Tarik Canvas</span>
          <span className="w-1 h-1 bg-[#E1E3EA] rounded-full"></span>
          <span>Scroll untuk Zoom</span>
          <span className="w-1 h-1 bg-[#E1E3EA] rounded-full"></span>
          <Route size={12} className="text-[#FFA800]" />
          <span>Klik Node untuk Sorot Alur</span>
        </div>
      </div>

    </div>
  );
};

export default VisualAssetMapModal;
