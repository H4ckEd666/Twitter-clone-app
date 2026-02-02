import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import OnlineDot from "../../components/common/OnlineDot";
import useFollow from "../../hooks/useFollow";

const SuggestedUsersPage = () => {
  const [tab, setTab] = useState("suggested");
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const { follow, isPending } = useFollow();

  const { data: followingUsers = [], isLoading: isFollowingLoading } = useQuery(
    {
      queryKey: ["followingUsers"],
      queryFn: async () => {
        const res = await fetch("/api/users/following");
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong!");
        }
        return data;
      },
    },
  );

  const { data: suggestedUsers = [], isLoading } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => {
      const res = await fetch("/api/users/suggested");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong!");
      }
      return data;
    },
  });

  const usersToRender = tab === "suggested" ? suggestedUsers : followingUsers;

  return (
    <div className="flex-[4_4_0] w-full border-r border-gray-700 min-h-screen">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-sm text-slate-400">
            Back
          </Link>
          <p className="font-bold">People</p>
        </div>
      </div>

      <div className="flex justify-center gap-2 px-4 py-3 border-b border-gray-700 text-sm">
        <button
          className={`btn btn-xs rounded-full ${
            tab === "suggested"
              ? "btn-primary text-white"
              : "btn-ghost text-slate-400"
          }`}
          onClick={() => setTab("suggested")}
        >
          Suggested users
        </button>
        <button
          className={`btn btn-xs rounded-full ${
            tab === "following"
              ? "btn-primary text-white"
              : "btn-ghost text-slate-400"
          }`}
          onClick={() => setTab("following")}
        >
          Following users
        </button>
      </div>

      {(isLoading || isFollowingLoading) && (
        <div className="flex justify-center h-full items-center p-6">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!isLoading && !isFollowingLoading && usersToRender.length === 0 && (
        <div className="text-center p-6 text-slate-500">No users to show.</div>
      )}

      {!isLoading && !isFollowingLoading && usersToRender.length > 0 && (
        <div className="flex flex-col items-center gap-4 p-4">
          {usersToRender.map((user) => {
            const isFollowing = authUser?.following?.includes(user._id);
            return (
              <div
                key={user._id}
                className="w-full max-w-xs border border-gray-700 rounded-lg p-4 flex flex-col items-center text-center gap-2"
              >
                <div className="avatar relative">
                  <div className="w-14 rounded-full overflow-hidden">
                    <img
                      src={
                        user.profileImage ||
                        user.profileImg ||
                        "/avatar-placeholder.png"
                      }
                    />
                  </div>
                  {tab === "following" && <OnlineDot userId={user._id} />}
                </div>
                <p className="font-bold text-base">{user.fullName}</p>
                <p className="text-sm text-slate-400">@{user.username}</p>
                {tab === "suggested" && (
                  <button
                    className={`btn rounded-full btn-sm ${
                      isFollowing
                        ? "btn-outline text-white"
                        : "bg-white text-black hover:bg-white hover:opacity-90"
                    }`}
                    onClick={() => follow(user._id)}
                    disabled={isPending}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuggestedUsersPage;
