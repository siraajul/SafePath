/** GeoJSON order: [longitude, latitude]. */
export type LngLat = [number, number];

export type Scenario =
  | 'WELL_COVERED'
  | 'SPARSE'
  | 'CRITICAL_UNKNOWN'
  | 'NO_DIFFERENCE'
  | 'OUTSIDE_PILOT';

/** ponytail: every Place is synthetic until a real geocoder is licensed. */
export type Place = {
  id: string;
  name: { bn: string; en: string };
  coordinate: LngLat;
  /** Only synthetic places carry a scenario; real places are never given invented data. */
  scenario?: Scenario;
};

/** Legend classes from the spec: verified, reported/unverified, old, unknown. */
export type EvidenceState = 'VERIFIED' | 'REPORTED' | 'OLD' | 'UNKNOWN';
export type SegmentCondition = 'GOOD' | 'CAUTION';
export type NoteKey =
  | 'lightingGood'
  | 'footpathClear'
  | 'crossingSupported'
  | 'lightingMixed'
  | 'footpathNarrow'
  | 'obstructionTemporary'
  | 'reportedUnverified'
  | 'observationOld'
  | 'noRecentData'
  | 'crossingUnknown';

export type RouteSegment = {
  id: string;
  lengthM: number;
  coordinates: LngLat[];
  evidence: EvidenceState;
  /** Null unless the evidence is VERIFIED. Missing data is never treated as good. */
  condition: SegmentCondition | null;
  critical: 'CROSSING' | null;
  noteKey: NoteKey;
  lastVerifiedAt: string | null;
};

export type ConditionLabel = 'BETTER_OBSERVED' | 'OBSERVED' | 'INSUFFICIENT_DATA' | 'NOT_ASSESSED';
export type ConfidenceLabel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RouteTag = 'FASTEST' | 'BETTER_OBSERVED';
export type NoticeKey = 'coverage' | 'criticalCrossing' | 'outsidePilot' | 'staleData';

export type RouteOption = {
  id: string;
  etaMinutes: number;
  distanceM: number;
  coordinates: LngLat[];
  segments: RouteSegment[];
  tags: RouteTag[];
  conditionLabel: ConditionLabel;
  observedLengthFraction: number;
  confidenceLabel: ConfidenceLabel;
  notices: { key: NoticeKey; percent?: number }[];
};

export type RecommendationStatus =
  | 'RECOMMENDED_BETTER_OBSERVED_CONDITIONS'
  | 'NO_MATERIAL_DIFFERENCE'
  | 'ABSTAINED_INSUFFICIENT_EVIDENCE'
  | 'ABSTAINED_CRITICAL_UNKNOWN'
  | 'AREA_UNSUPPORTED';

export type CompareRequest = {
  origin: LngLat;
  destination: LngLat;
  destinationId: string;
};

export type CompareResponse = {
  requestId: string;
  datasetVersion: string;
  scoringVersion: string;
  coverageArea: 'PILOT' | 'OUTSIDE';
  safetyGuarantee: false;
  recommendationStatus: RecommendationStatus;
  routes: RouteOption[];
  source: 'SYNTHETIC' | 'OSM_DEV';
  /** True when routes and observations are invented sample data. */
  synthetic: boolean;
};

export type ContactState = 'INVITED' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
export type TrustedContact = {
  id: string;
  name: string;
  phone: string;
  state: ContactState;
};

export type JourneyState = 'ACTIVE' | 'ENDED' | 'EXPIRED' | 'REVOKED';
export type Journey = {
  id: string;
  startedAt: number;
  expiresAt: number;
  recipientIds: string[];
  state: JourneyState;
};

export type ReportCategory = 'STREETLIGHT' | 'OBSTRUCTION' | 'NO_WALKWAY' | 'OTHER';
export type ReportState =
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'NEEDS_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';
export type Report = {
  /** Doubles as the idempotency key. */
  id: string;
  category: ReportCategory;
  /** Generalised to about 100 m before it is stored. */
  area: LngLat | null;
  placeId: string | null;
  occurredAt: number;
  note: string;
  photoUri: string | null;
  state: ReportState;
  createdAt: number;
};
