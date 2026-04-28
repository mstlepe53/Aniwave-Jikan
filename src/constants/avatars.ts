export interface AvatarOption {
  id: string;
  label: string;
  url: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'avatar1',  label: 'Yuki',    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Yuki&backgroundColor=b6e3f4' },
  { id: 'avatar2',  label: 'Hana',    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hana&backgroundColor=c0aede' },
  { id: 'avatar3',  label: 'Sora',    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sora&backgroundColor=d1d4f9' },
  { id: 'avatar4',  label: 'Miko',    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Miko&backgroundColor=ffd5dc' },
  { id: 'avatar5',  label: 'Ren',     url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ren&backgroundColor=ffdfbf' },
  { id: 'avatar6',  label: 'Aoi',     url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aoi&backgroundColor=c1f4c5' },
  { id: 'avatar7',  label: 'Kiri',    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kiri&backgroundColor=b6e3f4' },
  { id: 'avatar8',  label: 'Nami',    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nami&backgroundColor=ffd5dc' },
  { id: 'avatar9',  label: 'Tsubaki', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tsubaki&backgroundColor=c0aede' },
  { id: 'avatar10', label: 'Akira',   url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Akira&backgroundColor=d1d4f9' },
  { id: 'avatar11', label: 'Haru',    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Haru&backgroundColor=b6e3f4' },
  { id: 'avatar12', label: 'Daiki',   url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Daiki&backgroundColor=ffdfbf' },
  { id: 'avatar13', label: 'Ryo',     url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ryo&backgroundColor=c1f4c5' },
  { id: 'avatar14', label: 'Kaito',   url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kaito&backgroundColor=c0aede' },
];

export const VALID_AVATAR_IDS = new Set(AVATAR_OPTIONS.map(a => a.id));

export function getAvatarUrl(avatarId: string | null | undefined): string {
  const found = AVATAR_OPTIONS.find(a => a.id === avatarId);
  return found?.url ?? AVATAR_OPTIONS[0].url;
}
