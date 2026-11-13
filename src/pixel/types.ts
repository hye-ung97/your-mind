/** 픽셀 격자: 한 칸에 색 문자열 하나 (빈 칸은 null) */
export type Grid = (string | null)[][];
/** [x, y, w, h] */
export type Crop = [number, number, number, number];

export type Gender = 'f' | 'm';

/** 캐릭터 한 명의 모습. 비어 있는 값은 성별 기본값·기분 기본값으로 채워져요. */
export interface Look {
  gender?: Gender;
  mood?: string;
  face?: string;
  skin?: string;
  eyeColor?: string;
  hair?: string;
  hairColor?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  /** 쉼표로 구분한 소품 목록 (여러 개 겹쳐 쓰기) */
  acc?: string;
  bg?: string;
  topColor?: string;
  bottomColor?: string;
  shoesColor?: string;
  shadow?: boolean;
}

export interface Part { name: string; hidden?: boolean }
export interface MoodDef {
  label: string; color: string; soft: string; face: string; bg: string;
  rec: Partial<Record<'face' | 'hair' | 'top' | 'bottom' | 'shoes' | 'acc' | 'bg', string[]>>;
}
