import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usersService } from '../../services/users.service';
import { Avatar } from '../common/Avatar';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export function ProfilePanel() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const hasChanges = fullName !== user.fullName || username !== user.username || bio !== (user.bio ?? '');

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const updated = await usersService.updateProfile({ fullName, username, bio });
      setUser(updated);
      setSuccess('Profile updated');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not update profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingAvatar(true);
    setError(null);
    try {
      const updated = await usersService.uploadAvatar(file);
      setUser(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    setIsUploadingAvatar(true);
    setError(null);
    try {
      const updated = await usersService.deleteAvatar();
      setUser(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not remove avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className="thin-scrollbar h-full overflow-y-auto p-5">
      <div className="flex flex-col items-center gap-3 pb-6">
        <div className="relative">
          <Avatar src={user.avatarUrl} name={user.fullName} size="xl" />
          {isUploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100"
          >
            Change photo
          </button>
          {user.avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-soft">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="Tell people a bit about yourself"
            className="w-full resize-none rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <p className="text-right text-xs text-ink-faint">{bio.length}/160</p>
        </div>

        <div className="rounded-xl bg-surface-muted px-3.5 py-2.5 text-sm text-ink-faint">{user.phoneNumber}</div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
        {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">{success}</p>}

        <Button type="submit" isLoading={isSaving} disabled={!hasChanges} className="w-full">
          Save changes
        </Button>
      </form>

      <button
        onClick={() => logout()}
        className="mt-6 w-full rounded-xl border border-surface-border py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
      >
        Log out
      </button>
    </div>
  );
}
