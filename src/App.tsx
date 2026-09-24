import React, { useState, useEffect, useCallback } from 'react';
import { InnovationMatrix3D } from './components/InnovationMatrix3D';
import { NavigationHeader } from './components/NavigationHeader';
import { MatrixControlsOverlay } from './components/MatrixControlsOverlay';
import { InnovationFormModal } from './components/InnovationFormModal';
import { CubeInspectorDrawer } from './components/CubeInspectorDrawer';
import { InnovationsListDrawer } from './components/InnovationsListDrawer';
import { HoverTooltip } from './components/HoverTooltip';
import { AnalyticsSummary } from './components/AnalyticsSummary';
import { TaxonomyGuideModal } from './components/TaxonomyGuideModal';
import { ClearConfirmationModal } from './components/ClearConfirmationModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import {
  InnovationItem,
  InnovationType,
  InnovationNature,
  InnovationLocus,
  CubeState,
  MatrixFilters,
  ColorMode,
  MatrixLayoutMode,
} from './types/innovation';
import { CameraPreset } from './components/InnovationMatrix3D';
import {
  INITIAL_PRESET_INNOVATIONS,
  INNOVATION_TYPES,
  INNOVATION_NATURES,
  INNOVATION_LOCI,
} from './constants/innovationTaxonomy';
import { getCubeKey } from './utils/threeUtils';
import { exportToHTML, exportToCSV } from './utils/exportUtils';
import { Box, Sparkles, Plus } from 'lucide-react';

const STORAGE_KEY = 'innovation_matrix_108_cubes_user_v1';
const COMPANY_STORAGE_KEY = 'innovation_matrix_single_company_v1';

export default function App() {
  // Single company portfolio name across the entire application
  const [companyName, setCompanyName] = useState<string>(() => {
    try {
      return localStorage.getItem(COMPANY_STORAGE_KEY) || 'Apple Inc.';
    } catch {
      return 'Apple Inc.';
    }
  });

  // Start with completely blank innovations by default so user enters their own data
  const [innovations, setInnovations] = useState<InnovationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Filters & display configurations
  const [filters, setFilters] = useState<MatrixFilters>({
    activeType: 'all',
    activeNature: 'all',
    activeLocus: 'all',
    searchQuery: '',
  });

  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [colorMode, setColorMode] = useState<ColorMode>('nature');
  const [layoutMode, setLayoutMode] = useState<MatrixLayoutMode>('reference_3d');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');

  // Interactive selection & hover state
  const [selectedCube, setSelectedCube] = useState<CubeState | null>(null);
  const [hoveredCube, setHoveredCube] = useState<CubeState | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | undefined>();
  const [recentlyGrownKey, setRecentlyGrownKey] = useState<string | null>(null);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<InnovationItem | null>(null);
  const [isRegistryOpen, setIsRegistryOpen] = useState<boolean>(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [isTaxonomyGuideOpen, setIsTaxonomyGuideOpen] = useState<boolean>(false);
  const [preselectedFormCoords, setPreselectedFormCoords] = useState<{
    type?: InnovationType;
    nature?: InnovationNature;
    locus?: InnovationLocus;
  }>({});

  // Handle updating portfolio company name
  const handleSaveCompanyName = useCallback((newName: string) => {
    setCompanyName(newName);
    try {
      localStorage.setItem(COMPANY_STORAGE_KEY, newName);
    } catch {
      // Ignore
    }
    // Update all existing innovations to use the single company name
    setInnovations((prev) =>
      prev.map((item) => ({
        ...item,
        companyName: newName,
      }))
    );
  }, []);

  // Persist innovations changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(innovations));
    } catch {
      // Ignore quota errors
    }
  }, [innovations]);

  // Keep selectedCube state synced with innovations
  useEffect(() => {
    if (selectedCube) {
      const matched = innovations.filter(
        (i) =>
          i.type === selectedCube.type &&
          i.nature === selectedCube.nature &&
          i.locus === selectedCube.locus
      );
      setSelectedCube((prev) =>
        prev
          ? {
              ...prev,
              innovations: matched,
            }
          : null
      );
    }
  }, [innovations]);

  // Handle saving an innovation (both Add and Edit)
  const handleSaveInnovation = useCallback(
    (itemData: Omit<InnovationItem, 'id' | 'createdAt'>, existingId?: string) => {
      let savedItem: InnovationItem;

      if (existingId) {
        // Editing existing innovation
        setInnovations((prev) =>
          prev.map((item) => {
            if (item.id === existingId) {
              savedItem = {
                ...item,
                ...itemData,
                companyName: companyName, // Ensure single company name
              };
              return savedItem;
            }
            return item;
          })
        );
      } else {
        // Creating new innovation
        savedItem = {
          ...itemData,
          companyName: companyName, // Always associate with single portfolio company
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          createdAt: Date.now(),
        };
        setInnovations((prev) => [savedItem, ...prev]);
      }

      // Trigger visual growth and glow pulse on the cube
      const tIndex = INNOVATION_TYPES.indexOf(itemData.type);
      const nIndex = INNOVATION_NATURES.indexOf(itemData.nature);
      const lIndex = INNOVATION_LOCI.indexOf(itemData.locus);
      if (tIndex !== -1 && nIndex !== -1 && lIndex !== -1) {
        const key = getCubeKey(tIndex, nIndex, lIndex);
        setRecentlyGrownKey(key);

        setTimeout(() => {
          setRecentlyGrownKey(null);
        }, 2200);
      }

      setItemToEdit(null);
    },
    [companyName]
  );

  // Handle deleting an innovation
  const handleDeleteInnovation = useCallback((id: string) => {
    setInnovations((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Handle opening edit modal
  const handleStartEdit = useCallback((item: InnovationItem) => {
    setItemToEdit(item);
    setPreselectedFormCoords({
      type: item.type,
      nature: item.nature,
      locus: item.locus,
    });
    setIsAddModalOpen(true);
  }, []);

  // Quick add pre-populated to a specific cube
  const handleAddInnovationToCube = useCallback((cube: CubeState) => {
    setItemToEdit(null);
    setPreselectedFormCoords({
      type: cube.type,
      nature: cube.nature,
      locus: cube.locus,
    });
    setIsAddModalOpen(true);
  }, []);

  // Reset/Load demo presets
  const handleLoadPresets = useCallback(() => {
    // Map demo items to use the single company name
    const presetWithCompany = INITIAL_PRESET_INNOVATIONS.map((inv) => ({
      ...inv,
      companyName: companyName,
    }));
    setInnovations(presetWithCompany);
    setRecentlyGrownKey(null);
  }, [companyName]);

  // Export handlers
  const handleExportHTML = useCallback(() => {
    exportToHTML(innovations);
  }, [innovations]);

  const handleExportCSV = useCallback(() => {
    exportToCSV(innovations);
  }, [innovations]);

  // Reliable clear action that triggers confirmation modal (active and safe in all iframes)
  const handleConfirmClear = useCallback(() => {
    setInnovations([]);
    setSelectedCube(null);
    setRecentlyGrownKey(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Bar */}
      <NavigationHeader
        innovationsCount={innovations.length}
        companyName={companyName}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        onOpenAddModal={() => {
          setItemToEdit(null);
          setPreselectedFormCoords({});
          setIsAddModalOpen(true);
        }}
        onOpenRegistry={() => setIsRegistryOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenTaxonomyGuide={() => setIsTaxonomyGuideOpen(true)}
        onLoadExample={handleLoadPresets}
        onExportHTML={handleExportHTML}
        onExportCSV={handleExportCSV}
        onClearAll={() => setIsClearConfirmOpen(true)}
        onResetView={() => {
          setFilters({
            activeType: 'all',
            activeNature: 'all',
            activeLocus: 'all',
            searchQuery: '',
          });
          setSelectedCube(null);
        }}
        activeView={isAnalyticsOpen ? 'analytics' : isTaxonomyGuideOpen ? 'guide' : 'matrix'}
      />

      {/* Main 3D Simulation Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Empty State Banner (shows only when 0 innovations exist) */}
        {innovations.length === 0 && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-full px-5 py-2.5 flex items-center gap-3.5 shadow-2xl">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Box className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-white">108-Cube 3D Matrix Ready</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 text-xs">Blank outline waiting for data</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadPresets}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Example</span>
              </button>
              <button
                onClick={() => {
                  setItemToEdit(null);
                  setPreselectedFormCoords({});
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-full transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Matrix Controls (Top Search + Right Controls) */}
        <MatrixControlsOverlay
          filters={filters}
          onFilterChange={setFilters}
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          autoRotate={autoRotate}
          onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
          cameraPreset={cameraPreset}
          onCameraPresetChange={setCameraPreset}
          activeInnovationsCount={innovations.length}
        />

        {/* WebGL 3D Matrix Viewport (compact 0.0 explode factor) */}
        <InnovationMatrix3D
          innovations={innovations}
          filters={filters}
          colorMode={colorMode}
          layoutMode={layoutMode}
          explodeFactor={0}
          autoRotate={autoRotate}
          cameraPreset={cameraPreset}
          selectedCubeKey={selectedCube ? selectedCube.cubeKey : null}
          recentlyGrownKey={recentlyGrownKey}
          onSelectCube={(cube) => setSelectedCube(cube)}
          onHoverCube={(cube, screenPos) => {
            setHoveredCube(cube);
            setHoverPos(screenPos);
          }}
        />

        {/* 3D Raycast Hover Tooltip */}
        <HoverTooltip cube={hoveredCube} position={hoverPos} />

        {/* Auto-Opening Cell Inspector Drawer */}
        <CubeInspectorDrawer
          cube={selectedCube}
          onClose={() => setSelectedCube(null)}
          onAddInnovationToCube={handleAddInnovationToCube}
          onEditInnovation={handleStartEdit}
          onDeleteInnovation={handleDeleteInnovation}
        />

        {/* Innovations Registry List Drawer */}
        <InnovationsListDrawer
          isOpen={isRegistryOpen}
          onClose={() => setIsRegistryOpen(false)}
          innovations={innovations}
          onEditInnovation={handleStartEdit}
          onDeleteInnovation={handleDeleteInnovation}
          onAddNew={() => {
            setItemToEdit(null);
            setPreselectedFormCoords({});
            setIsAddModalOpen(true);
          }}
          onLoadExample={handleLoadPresets}
          onExportHTML={handleExportHTML}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Add / Edit Innovation Modal Form */}
      <InnovationFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setItemToEdit(null);
        }}
        onSubmit={handleSaveInnovation}
        initialType={preselectedFormCoords.type}
        initialNature={preselectedFormCoords.nature}
        initialLocus={preselectedFormCoords.locus}
        itemToEdit={itemToEdit}
        companyName={companyName}
      />

      {/* Clear 108-Cube Matrix Confirmation Modal (active & reliable) */}
      <ClearConfirmationModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClear}
        innovationsCount={innovations.length}
      />

      {/* Portfolio Single Company Settings Modal */}
      <CompanySettingsModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        currentCompanyName={companyName}
        onSaveCompanyName={handleSaveCompanyName}
      />

      {/* Analytics Summary Modal */}
      <AnalyticsSummary
        innovations={innovations}
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Taxonomy Guide Modal */}
      <TaxonomyGuideModal
        isOpen={isTaxonomyGuideOpen}
        onClose={() => setIsTaxonomyGuideOpen(false)}
      />
    </div>
  );
}
