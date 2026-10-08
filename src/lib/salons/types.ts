/** Types agrégés pour l'UI du salon communautaire. */

import type {
  PostRow,
  CommentRow,
  SalonRow,
  SalonMemberRow,
  ProfileRow,
  SalonChatMessageRow,
  SalonChatReactionRow,
} from "@/types/database";

export interface SalonWithMemberCount extends SalonRow {
  members: Pick<SalonMemberRow, "user_id" | "role" | "joined_at">[];
}

export interface PostWithAuthor extends Omit<PostRow, "media" | "mentions"> {
  author: Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "is_verified"> | null;
  media: { url: string; kind: "image" | "video"; thumbnail_url?: string | null }[];
  mentions: { id: string; display_name: string }[];
  my_reaction: ReactionType | null;
  /** true si l'utilisateur courant a déjà réagi à ce post */
  has_reacted: boolean;
}

export interface CommentWithAuthor extends Omit<CommentRow, "mentions"> {
  author: Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "is_verified"> | null;
  mentions: { id: string; display_name: string }[];
  replies: CommentWithAuthor[];
  my_reaction: ReactionType | null;
  has_reacted: boolean;
}

export type ReactionType = "like" | "love" | "fire" | "clap" | "wow";

export interface SalonChatMessageWithAuthor extends SalonChatMessageRow {
  author: Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "is_verified"> | null;
  reactions: SalonChatReactionRow[];
  my_reactions: SalonChatReactionRow["reaction"][];
}

export interface SalonMemberWithProfile extends SalonMemberRow {
  profile: Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "city" | "is_verified"> | null;
  is_online: boolean;
}
