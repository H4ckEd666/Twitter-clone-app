import { Link } from "react-router-dom";
import { FaHeart, FaUserPlus } from "react-icons/fa";
import { FaRegComment } from "react-icons/fa6";
import { BiRepost } from "react-icons/bi";

const ActivityIcon = ({ type }) => {
  switch (type) {
    case "like":
      return <FaHeart className="w-5 h-5 text-red-500" />;
    case "comment":
      return <FaRegComment className="w-5 h-5 text-sky-500" />;
    case "share":
      return <BiRepost className="w-5 h-5 text-green-500" />;
    case "follow":
      return <FaUserPlus className="w-5 h-5 text-primary" />;
    default:
      return <BiRepost className="w-5 h-5 text-slate-400" />;
  }
};

const ActivityItem = ({ activity }) => {
  const from = activity.from;
  const post = activity.post;

  return (
    <div className="border-b border-gray-700 p-4">
      <div className="flex gap-3">
        <ActivityIcon type={activity.type} />
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${from?.username}`} className="font-bold">
              @{from?.username}
            </Link>
            <span className="text-slate-500 text-sm">
              {activity.type === "post" && "posted"}
              {activity.type === "like" && "liked a post"}
              {activity.type === "comment" && "commented on a post"}
              {activity.type === "share" && "shared a post"}
              {activity.type === "follow" && "followed someone"}
            </span>
          </div>
          {post && (
            <div className="rounded border border-gray-700 bg-[#0b0d10] p-2">
              <p className="text-sm text-slate-300 line-clamp-2">{post.text}</p>
              {post.img && (
                <img
                  src={post.img}
                  alt="post"
                  className="mt-2 max-h-40 w-full object-contain rounded"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FollowingActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return <p className="text-center my-4">No activity yet.</p>;
  }

  return (
    <div>
      {activities.map((activity, idx) => (
        <ActivityItem
          key={activity._id || `${activity.type}-${idx}`}
          activity={activity}
        />
      ))}
    </div>
  );
};

export default FollowingActivity;
