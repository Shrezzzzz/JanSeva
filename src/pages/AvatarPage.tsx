import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarCarousel from '../components/avatars/AvatarCarousel';
import { normalizeAvatarId, type AvatarId } from '../components/avatars/avatar-data';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function AvatarPage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSelect(avatarId: AvatarId) {
    if (!user || saving) return;
    setSaving(true);
    try {
      const res = await api.patch('/users/character', { characterId: avatarId });
      if (res.data.success) {
        setUser({ ...user, activeCharacter: avatarId });
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AvatarCarousel
      userXP={user?.xp ?? 0}
      selectedAvatar={normalizeAvatarId(user?.activeCharacter)}
      saving={saving}
      saved={saved}
      onSelect={handleSelect}
      onBack={() => navigate('/profile')}
    />
  );
}
