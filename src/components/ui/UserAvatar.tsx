interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

/**
 * Renders the user's real avatar image if available,
 * otherwise falls back to a deterministic real human photo via pravatar.cc.
 */
const UserAvatar = ({ name, avatarUrl, className = "" }: UserAvatarProps) => {
  const src =
    avatarUrl ||
    `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;

  return (
    <img
      src={src}
      alt={name}
      className={`object-cover ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

export default UserAvatar;
