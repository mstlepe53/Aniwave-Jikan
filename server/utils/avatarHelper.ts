const AVATAR_URLS: Record<string, string> = {
  avatar1:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Yuki&backgroundColor=b6e3f4',
  avatar2:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Hana&backgroundColor=c0aede',
  avatar3:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sora&backgroundColor=d1d4f9',
  avatar4:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Miko&backgroundColor=ffd5dc',
  avatar5:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ren&backgroundColor=ffdfbf',
  avatar6:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aoi&backgroundColor=c1f4c5',
  avatar7:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Kiri&backgroundColor=b6e3f4',
  avatar8:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nami&backgroundColor=ffd5dc',
  avatar9:  'https://api.dicebear.com/7.x/adventurer/svg?seed=Tsubaki&backgroundColor=c0aede',
  avatar10: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Akira&backgroundColor=d1d4f9',
};

export function getAvatarUrl(avatarId: string | null | undefined): string {
  return AVATAR_URLS[avatarId ?? ''] ?? AVATAR_URLS['avatar1'];
}
