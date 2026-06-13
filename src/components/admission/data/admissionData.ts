import admissionData from '../../../data/admission/admissionData.json';

export type AdmissionRow = {
  region: string;
  subRegion: string;
  univ: string;
  track: string;
  dept: string;
  type: string;
  name: string;
  cutoff24: number | null;
  cutoff25: number | null;
  cutoff26: number | null;
  req: string;
};

export const ADMISSION_DATA = admissionData as AdmissionRow[];
