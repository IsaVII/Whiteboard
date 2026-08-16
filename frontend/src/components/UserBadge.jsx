// User list display - shows all connected users in the board room
import { useSelector } from "react-redux";

export default function UserBadge() {
  const currentName = useSelector((state) => state.user.name);
  const usersInRoom = useSelector((state) => state.user.usersInRoom);

  // Color text mapping for contrast
  const textColorMap = {
    "bg-yellow-400": "text-gray-900",
    "bg-blue-400": "text-white",
    "bg-purple-400": "text-white",
    "bg-pink-400": "text-white",
    "bg-green-400": "text-white",
    "bg-red-400": "text-white",
    "bg-indigo-400": "text-white",
    "bg-cyan-400": "text-white",
    "bg-orange-400": "text-white",
    "bg-teal-400": "text-white",
  };

  // Render list of connected users with current user highlighted
  return (
    <div className="flex flex-wrap gap-2 items-center mt-[15px]">
      <span className="font-semibold text-gray-700">Users:</span>
      {usersInRoom.map((user) => (
        <span
          key={`${user.name}`}
          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium transition-transform hover:scale-105 ${user.color} ${textColorMap[user.color]} ${
            user.name === currentName
              ? "ring-2 ring-offset-1 ring-gray-400"
              : ""
          }`}
        >
          {user.name === currentName ? `${user.name} (you)` : user.name}
        </span>
      ))}
    </div>
  );
}
