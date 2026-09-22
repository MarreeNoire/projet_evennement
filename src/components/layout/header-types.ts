/* =============================================================================
   Types partagés de l'en-tête
   ========================================================================== */

export interface HeaderUser {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  isOrganizer: boolean;
  isAdmin: boolean;
}