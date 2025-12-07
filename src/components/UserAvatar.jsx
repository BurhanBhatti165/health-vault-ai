import { User } from "lucide-react";

const UserAvatar = ({ user, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10"
  };

  if (user?.profileImage) {
    return (
      <img 
        src={user.profileImage} 
        alt={user.name || "User"}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-primary ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-primary flex items-center justify-center ${className}`}>
      <User className={`${iconSizes[size]} text-white`} />
    </div>
  );
};

export default UserAvatar;
