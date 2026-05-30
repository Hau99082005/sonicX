export const getAvatarUrl = (avatar: any, name?: string) => {
  if (avatar) {
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
      return avatar;
    }
    if (typeof avatar === 'object' && avatar.url) {
      return avatar.url;
    }
  }
  
  const displayName = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=128`;
};
