
export type Agent = string;

export interface ConversationMessage {
  id: string;
  role: 'user' | 'model' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  summary?: string; // Optional summary for any long message
  imageUrl?: string; // To store a URL for a user-sent image
  fileName?: string; // To store the name of an uploaded file
  blockType?: 'code' | 'text' | 'prompt'; // To identify a message as a code block, text to copy, or prompt
  youtubeVideoId?: string; // New field for embedded YouTube player
  youtubeTitle?: string; // New field for YouTube video title
  youtubeChannel?: string; // New field for YouTube channel name
  audioUrl?: string; // New field for generated music audio URL
}

export interface Conversation {
  id: string; // Firestore document ID
  uid: string; // Foreign key to user
  title: string;
  createdAt: Date; // From Firestore timestamp
  isArchived?: boolean; // To support the archive feature
  summary?: string; // Long-term memory summary
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  subscriptionStatus: 'pending' | 'active' | 'inactive' | 'canceled';
  status: 'active' | 'blocked' | 'pending'; // New field for status
  createdAt: Date;
  lastSeen?: Date;
  profilePicUrl?: string;
  theme?: string;
  customThemeColor?: string;
  voiceName?: string;
  voiceSpeed?: number;
  voicePitch?: number;
  textToSpeechEnabled?: boolean;
  usingOwnKey?: boolean;
  allowedIP?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;
  usage?: {
    totalTokens: number;
    totalCost: number;
    remainingTokens: number;
  };
  programmingLevel?: 'basic' | 'intermediate' | 'advanced';
  assistantCustomName?: string;
  userPreferredName?: string;
  tone?: 'formal' | 'informal' | 'technical' | 'humorous';
  role?: 'admin' | 'user';
  youtubeApiKey?: string;
  alarmSound?: string;
}

export interface AuthorizedEmail {
  id: string; // Gmail address
  status: 'active' | 'blocked';
  addedAt: Date;
  addedBy: string; // Admin email
}

export interface SecurityLog {
  id: string;
  userId?: string;
  email: string;
  action: 'login' | 'login_denied' | 'blocked' | 'unblocked' | 'admin_action';
  timestamp: Date;
  status: 'success' | 'failure';
  ip?: string;
  details?: string;
}

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  createdAt: Date;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  videoUrl?: string;
  linkUrl?: string; // URL for the clickable button
  linkText?: string; // Text for the clickable button
  projectName?: string; // Optional project name to associate the notification
  createdAt: Date;
  viewCount?: number; // Tracks how many users have opened this notification
}

export interface BugReport {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  whatsapp: string;
  description: string;
  screenshotUrl?: string;
  createdAt: Date;
  status: 'open' | 'resolved';
}

export interface AtlasMemorySupabase {
  id?: string;
  content?: string;
  memory_type?: string;
  created_at?: string;
  user_id?: string;
  memory?: string;
  importance?: number;
  type?: string;
}
