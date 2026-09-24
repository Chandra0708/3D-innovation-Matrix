export type InnovationType =
  | 'Design & Marketing'
  | 'Product'
  | 'Service'
  | 'Market & Customer Channel'
  | 'Technology'
  | 'Process'
  | 'Management'
  | 'Business Model'
  | 'Industry';

export type InnovationNature =
  | 'Sustaining'
  | 'Efficiency'
  | 'Disruptive';

export type InnovationLocus =
  | 'Small Teams'
  | 'Projects'
  | 'Organisations'
  | 'Business Ecosystem';

export interface InnovationItem {
  id: string;
  companyName: string;
  innovationName: string;
  description?: string;
  type: InnovationType;
  nature: InnovationNature;
  locus: InnovationLocus;
  year?: number;
  createdAt: number;
}

export interface CubeCoordinate {
  typeIndex: number;    // 0 to 8
  natureIndex: number;  // 0 to 2
  locusIndex: number;   // 0 to 3
}

export interface CubeState {
  coordinate: CubeCoordinate;
  cubeKey: string; // e.g. "0-1-2"
  type: InnovationType;
  nature: InnovationNature;
  locus: InnovationLocus;
  innovations: InnovationItem[];
  currentScale: number;
  targetScale: number;
}

export type ColorMode = 'nature' | 'type' | 'heatmap';
export type MatrixLayoutMode = 'reference_3d' | 'horizontal_types_3d';

export interface MatrixFilters {
  activeType: InnovationType | 'all';
  activeNature: InnovationNature | 'all';
  activeLocus: InnovationLocus | 'all';
  searchQuery: string;
}
