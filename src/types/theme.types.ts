export enum BorderRadius {
  NONE = "NONE",
  SOFT = "SOFT",
  ROUNDED = "ROUNDED",
}

export interface CreateThemeRequest {
  name: string;
  funnelId: number;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderColor?: string;
  optionColor?: string;
  fontFamily?: string;
  borderRadius?: BorderRadius;
}

export interface UpdateThemeRequest {
  name?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderColor?: string;
  optionColor?: string;
  fontFamily?: string;
  borderRadius?: BorderRadius;
}

export interface CreateThemeResponse {
  id: number;
  name: string;
  funnelId: number;
  message: string;
}

export interface UpdateThemeResponse {
  success: boolean;
  message: string;
}

export interface CreateThemeData {
  name?: string;
  funnelId: number;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderColor?: string;
  optionColor?: string;
  fontFamily?: string;
  borderRadius?: BorderRadius;
}

export interface UpdateThemeData {
  name?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderColor?: string;
  optionColor?: string;
  fontFamily?: string;
  borderRadius?: BorderRadius;
}

export interface ThemeResponse {
  id: number;
  name: string;
  funnelId?: number;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderColor: string;
  optionColor: string;
  fontFamily: string;
  borderRadius: BorderRadius;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateThemeResponse {
  id: number;
  name: string;
  funnelId: number;
  message: string;
}
